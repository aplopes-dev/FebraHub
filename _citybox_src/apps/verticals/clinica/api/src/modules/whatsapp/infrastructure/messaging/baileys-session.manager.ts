import { Injectable, Logger } from '@nestjs/common';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  type ConnectionState,
  type WASocket,
  type WAMessage,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import * as fs from 'fs/promises';
import * as path from 'path';
import QRCode from 'qrcode';
import { WhatsappConnectionRepository } from '../../domain/repositories/whatsapp-connection.repository.interface';
import { WhatsappMessageRepository } from '../../domain/repositories/whatsapp-message.repository.interface';
import { ProcessWhatsappInboundUseCase } from '../../application/use-cases/process-inbound/process-whatsapp-inbound.use-case';
import {
  baileysJidToE164,
  e164ToBaileysJid,
  whatsappNumberCandidates,
} from '../../domain/utils/phone-e164';
import { extractInboundMessageBody } from '../../domain/utils/extract-inbound-message-body';

const AUTH_ROOT =
  process.env.WHATSAPP_AUTH_DIR?.trim() ||
  path.join(process.cwd(), 'data', 'whatsapp');

/** Janela em que pedidos repetidos de pareamento são ignorados (cliques/eventos duplicados). */
const PAIRING_COOLDOWN_MS = 15_000;
/** Tempo máximo aguardando `connection === 'open'` antes de enviar. */
const OPEN_WAIT_MS = 45_000;
/** Tentativas de envio quando a sessão cai no meio (Connection Closed / timeout). */
const SEND_ATTEMPTS = 3;

@Injectable()
export class BaileysSessionManager {
  private readonly logger = new Logger(BaileysSessionManager.name);
  private readonly sockets = new Map<string, WASocket>();
  private readonly openStores = new Set<string>();
  private readonly openWaiters = new Map<
    string,
    Array<{
      resolve: (sock: WASocket) => void;
      reject: (err: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    }>
  >();
  private readonly starting = new Set<string>();
  private readonly startedAt = new Map<string, number>();

  constructor(
    private readonly connectionRepository: WhatsappConnectionRepository,
    private readonly messageRepository: WhatsappMessageRepository,
    private readonly processInbound: ProcessWhatsappInboundUseCase,
  ) {}

  /**
   * Pedido de pareamento vindo da UI. Cliques repetidos (e eventos que ficaram na
   * fila) chegam em rajada; derrubar o socket a cada um aborta o pareamento em
   * andamento e faz o QR trocar debaixo do usuário.
   */
  async requestPairing(storeId: string): Promise<void> {
    const startedAt = this.startedAt.get(storeId);
    const recent =
      startedAt != null && Date.now() - startedAt < PAIRING_COOLDOWN_MS;
    if (this.sockets.has(storeId) && recent) {
      this.logger.log(
        `Pareamento já em andamento storeId=${storeId} — ignorado`,
      );
      return;
    }
    await this.startSession(storeId, { force: true });
  }

  /**
   * `force` = pedido explícito de pareamento: derruba o socket atual para que o
   * Baileys reemita o evento `qr` (sem force, um socket vivo/pendente bloquearia
   * a geração de um novo QR).
   */
  async startSession(
    storeId: string,
    opts: { force?: boolean } = {},
  ): Promise<void> {
    if (this.starting.has(storeId)) {
      return;
    }
    const existing = this.sockets.get(storeId);
    if (existing && !opts.force) {
      return;
    }
    this.starting.add(storeId);
    try {
      if (existing) {
        this.sockets.delete(storeId);
        this.clearOpenState(storeId);
        try {
          void existing.end(undefined);
        } catch {
          /* ignore */
        }
      }
      this.startedAt.set(storeId, Date.now());
      await this.openSocket(storeId);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`startSession failed storeId=${storeId}: ${errMsg}`);
      this.sockets.delete(storeId);
      await this.connectionRepository.upsertStatus(storeId, {
        status: 'error',
        qrBase64: null,
        lastError: errMsg,
      });
    } finally {
      this.starting.delete(storeId);
    }
  }

  async stopSession(storeId: string): Promise<void> {
    const sock = this.sockets.get(storeId);
    if (sock) {
      try {
        await sock.logout();
      } catch {
        /* ignore */
      }
      this.sockets.delete(storeId);
    }
    this.clearOpenState(storeId);
    this.startedAt.delete(storeId);
    const authDir = path.join(AUTH_ROOT, storeId);
    await fs.rm(authDir, { recursive: true, force: true });
    await this.connectionRepository.upsertStatus(storeId, {
      status: 'disconnected',
      qrBase64: null,
      phoneE164: null,
    });
  }

  async sendQueuedMessage(storeId: string, messageId: string): Promise<void> {
    const message = await this.messageRepository.findById(storeId, messageId);
    if (!message || message.direction !== 'outbound') {
      return;
    }
    if (message.status === 'sent' || message.status === 'delivered') {
      return;
    }

    let lastErr: string | null = null;

    for (let attempt = 1; attempt <= SEND_ATTEMPTS; attempt++) {
      try {
        const sock = await this.ensureOpenSocket(storeId);
        const jid = await this.resolveRecipientJid(sock, message.toE164);
        if (!jid) {
          const errMsg = `Número sem WhatsApp ativo: ${message.toE164}`;
          this.logger.warn(
            `send skipped storeId=${storeId} messageId=${messageId}: ${errMsg}`,
          );
          message.markFailed(errMsg);
          await this.messageRepository.save(message);
          return;
        }

        const result = await sock.sendMessage(jid, { text: message.body });
        const providerId =
          result?.key?.id != null ? String(result.key.id) : null;
        message.markSent(providerId);
        await this.messageRepository.save(message);
        this.logger.log(
          `sent storeId=${storeId} messageId=${messageId} jid=${jid}`,
        );
        return;
      } catch (err) {
        lastErr = err instanceof Error ? err.message : String(err);
        const transient = isTransientSendError(lastErr);
        this.logger.warn(
          `send attempt ${attempt}/${SEND_ATTEMPTS} failed storeId=${storeId} messageId=${messageId}: ${lastErr}`,
        );
        if (!transient || attempt === SEND_ATTEMPTS) {
          break;
        }
        // Connection Closed / timeout: o socket no Map pode estar morto e o
        // evento `close` ainda não ter limpo. Força reabertura antes do retry.
        const dead = this.sockets.get(storeId);
        if (dead) {
          this.sockets.delete(storeId);
          this.clearOpenState(storeId);
          try {
            void dead.end(undefined);
          } catch {
            /* ignore */
          }
        }
        await sleep(1_500 * attempt);
      }
    }

    message.markFailed(lastErr ?? 'Falha ao enviar WhatsApp');
    await this.messageRepository.save(message);
    this.logger.error(
      `send failed storeId=${storeId} messageId=${messageId}: ${lastErr}`,
    );
  }

  /**
   * Garante um socket com `connection === 'open'`. Ter o objeto no Map não
   * basta — o Baileys reabre o stream (515 / queda) e um send nesse intervalo
   * vira `Connection Closed` sem a mensagem sair.
   */
  private async ensureOpenSocket(storeId: string): Promise<WASocket> {
    const current = this.sockets.get(storeId);
    if (current && this.openStores.has(storeId)) {
      return current;
    }
    await this.startSession(storeId);
    return this.waitUntilOpen(storeId);
  }

  private waitUntilOpen(storeId: string): Promise<WASocket> {
    const already = this.sockets.get(storeId);
    if (already && this.openStores.has(storeId)) {
      return Promise.resolve(already);
    }

    return new Promise<WASocket>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.removeOpenWaiter(storeId, entry);
        reject(
          new Error(
            `Timeout aguardando conexão WhatsApp aberta (${OPEN_WAIT_MS}ms)`,
          ),
        );
      }, OPEN_WAIT_MS);

      const entry = { resolve, reject, timer };
      const list = this.openWaiters.get(storeId) ?? [];
      list.push(entry);
      this.openWaiters.set(storeId, list);

      // Sessão pode ter aberto entre o check e o registro do waiter.
      const sock = this.sockets.get(storeId);
      if (sock && this.openStores.has(storeId)) {
        this.removeOpenWaiter(storeId, entry);
        clearTimeout(timer);
        resolve(sock);
      }
    });
  }

  private removeOpenWaiter(
    storeId: string,
    entry: {
      resolve: (sock: WASocket) => void;
      reject: (err: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    },
  ): void {
    const list = this.openWaiters.get(storeId);
    if (!list) return;
    const next = list.filter((w) => w !== entry);
    if (next.length === 0) this.openWaiters.delete(storeId);
    else this.openWaiters.set(storeId, next);
  }

  private notifyOpen(storeId: string, sock: WASocket): void {
    this.openStores.add(storeId);
    const waiters = this.openWaiters.get(storeId) ?? [];
    this.openWaiters.delete(storeId);
    for (const w of waiters) {
      clearTimeout(w.timer);
      w.resolve(sock);
    }
  }

  private clearOpenState(storeId: string): void {
    this.openStores.delete(storeId);
  }

  /**
   * O WhatsApp não avisa quando o destino não existe: `sendMessage` resolve
   * normalmente e a mensagem simplesmente não chega. Por isso o JID é resolvido
   * via `onWhatsApp` antes do envio, testando também a variante sem o nono
   * dígito (contas BR antigas).
   */
  private async resolveRecipientJid(
    sock: WASocket,
    toE164: string,
  ): Promise<string | null> {
    let lookupFailed = false;

    for (const candidate of whatsappNumberCandidates(toE164)) {
      try {
        const results = await sock.onWhatsApp(candidate);
        const found = results?.find((entry) => entry.exists);
        if (found) {
          return found.jid;
        }
      } catch (err) {
        lookupFailed = true;
        this.logger.warn(
          `onWhatsApp failed for ${candidate}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }

    return lookupFailed ? e164ToBaileysJid(toE164) : null;
  }

  private async openSocket(storeId: string): Promise<void> {
    const authDir = path.join(AUTH_ROOT, storeId);
    await fs.mkdir(authDir, { recursive: true });
    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      syncFullHistory: false,
      markOnlineOnConnect: false,
    });

    this.sockets.set(storeId, sock);

    sock.ev.on('creds.update', () => {
      void saveCreds();
    });

    sock.ev.on('connection.update', (update) => {
      void this.handleConnectionUpdate(storeId, authDir, sock, update);
    });

    sock.ev.on('messages.upsert', ({ messages, type }) => {
      if (type !== 'notify') return;
      void this.handleInboundBatch(storeId, messages);
    });

    sock.ev.on('messages.update', (updates) => {
      void this.handleMessageStatusUpdates(storeId, updates);
    });
  }

  private async handleMessageStatusUpdates(
    storeId: string,
    updates: Array<{
      key: { id?: string | null };
      update: { status?: number | null };
    }>,
  ): Promise<void> {
    for (const entry of updates) {
      const providerId = entry.key.id;
      const status = entry.update.status;
      if (!providerId || status == null) continue;

      // Baileys: 3 = DELIVERY_ACK, 4 = READ, 5 = PLAYED
      if (status < 3) continue;

      try {
        const message = await this.messageRepository.findByProviderMessageId(
          storeId,
          providerId,
        );
        if (!message || message.direction !== 'outbound') continue;
        if (message.status === 'delivered' || message.status === 'failed') {
          continue;
        }
        message.markDelivered();
        await this.messageRepository.save(message);
      } catch (err) {
        this.logger.warn(
          `messages.update failed storeId=${storeId} id=${providerId}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }
  }

  private async handleConnectionUpdate(
    storeId: string,
    authDir: string,
    sock: WASocket,
    update: Partial<ConnectionState>,
  ): Promise<void> {
    const { connection, lastDisconnect, qr } = update;

    // Sockets substituídos continuam emitindo eventos (o timer de refresh do QR, por
    // exemplo). Deixá-los escrever no banco reverte o status da sessão atual.
    if (this.sockets.get(storeId) !== sock) {
      return;
    }

    try {
      if (qr) {
        const qrBase64 = await QRCode.toDataURL(qr);
        await this.connectionRepository.upsertStatus(storeId, {
          status: 'qr_pending',
          qrBase64,
          lastError: null,
        });
        this.logger.log(`QR pending storeId=${storeId}`);
      }

      if (connection === 'open') {
        const phone =
          sock.user?.id != null ? baileysJidToE164(sock.user.id) : null;
        await this.connectionRepository.upsertStatus(storeId, {
          status: 'connected',
          phoneE164: phone,
          qrBase64: null,
        });
        this.notifyOpen(storeId, sock);
        this.logger.log(`Connected storeId=${storeId}`);
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom | undefined)?.output
          ?.statusCode;
        this.sockets.delete(storeId);
        this.clearOpenState(storeId);

        if (statusCode === DisconnectReason.loggedOut) {
          await this.connectionRepository.upsertStatus(storeId, {
            status: 'disconnected',
            qrBase64: null,
            phoneE164: null,
            lastError: 'Sessão encerrada no celular',
          });
          await fs.rm(authDir, { recursive: true, force: true });
          return;
        }

        // 515: o WhatsApp sempre encerra o stream logo após o pareamento e exige
        // reabrir com as credenciais recém-salvas. Não é queda de conexão — manter
        // o status atual e reabrir na hora, senão a UI mostra erro no meio do fluxo.
        if (statusCode === DisconnectReason.restartRequired) {
          this.logger.log(`Restart required storeId=${storeId} — reabrindo`);
          await this.startSession(storeId, { force: true });
          return;
        }

        if (statusCode === DisconnectReason.connectionReplaced) {
          await this.connectionRepository.upsertStatus(storeId, {
            status: 'error',
            qrBase64: null,
            lastError: 'Sessão aberta em outro aparelho ou aba',
          });
          return;
        }

        await this.connectionRepository.upsertStatus(storeId, {
          status: 'error',
          lastError: 'Conexão perdida — reconectando…',
        });
        setTimeout(() => {
          void this.startSession(storeId);
        }, 3000);
      }
    } catch (err) {
      this.logger.error(
        `connection.update failed storeId=${storeId}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  private async handleInboundBatch(
    storeId: string,
    messages: WAMessage[],
  ): Promise<void> {
    for (const msg of messages) {
      await this.handleInbound(storeId, msg);
    }
  }

  private async handleInbound(storeId: string, msg: WAMessage): Promise<void> {
    if (msg.key.fromMe) return;
    const jid = msg.key.remoteJid;
    if (!jid || jid.endsWith('@g.us')) return;

    const text = extractInboundMessageBody(msg);
    if (text === null) return;

    const fromE164 = await this.resolveSenderE164(storeId, msg);
    if (!fromE164) {
      this.logger.warn(
        `inbound sem telefone identificável storeId=${storeId} jid=${jid}`,
      );
      return;
    }

    try {
      const result = await this.processInbound.execute({
        storeId,
        fromE164,
        body: text,
        providerMessageId: msg.key.id ?? null,
      });
      this.logger.log(
        `inbound storeId=${storeId} from=${fromE164} action=${result.action} appointmentId=${result.appointmentId ?? '-'}`,
      );
    } catch (err) {
      this.logger.error(
        `inbound failed storeId=${storeId}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  /**
   * O WhatsApp entrega o remetente como LID (`…@lid`) desde a v7 do Baileys —
   * daí não sai telefone. O PN vem em `remoteJidAlt`, e como último recurso é
   * consultado no mapa LID→PN da própria sessão.
   */
  private async resolveSenderE164(
    storeId: string,
    msg: WAMessage,
  ): Promise<string | null> {
    const direct = [msg.key.remoteJid, msg.key.remoteJidAlt]
      .filter((jid): jid is string => !!jid?.endsWith('@s.whatsapp.net'))
      .map((jid) => baileysJidToE164(jid))
      .find((phone): phone is string => phone != null);
    if (direct) return direct;

    const lid = [msg.key.remoteJid, msg.key.remoteJidAlt].find((jid) =>
      jid?.endsWith('@lid'),
    );
    if (!lid) return null;

    try {
      const pn = await this.sockets
        .get(storeId)
        ?.signalRepository.lidMapping.getPNForLID(lid);
      return pn ? baileysJidToE164(pn) : null;
    } catch (err) {
      this.logger.warn(
        `LID→PN falhou storeId=${storeId} lid=${lid}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return null;
    }
  }
}

function isTransientSendError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('connection closed') ||
    normalized.includes('timed out') ||
    normalized.includes('timeout') ||
    normalized.includes('connection lost') ||
    normalized.includes('not connected') ||
    normalized.includes('aguardando conexão')
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
