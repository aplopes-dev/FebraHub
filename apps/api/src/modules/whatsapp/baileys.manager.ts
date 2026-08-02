/**
 * Conexão Baileys do FebraHub — porte SINGLE-TENANT do
 * baileys-connection.manager.ts do crm-aplopes (a origem gerencia um socket
 * por organização; aqui existe UM). Roda no processo da API, como a origem
 * roda em produção — débito assumido e documentado em
 * docs/INTEGRACAO_HUB_CRM.md; a sessão vive em volume próprio.
 *
 * Verdades herdadas da origem que este arquivo preserva:
 *  - baileys é ESM puro e a API compila CJS → import dinâmico memoizado;
 *  - workaround de pareamento: WhatsApp recusa plataforma WEB com 405 antes
 *    do QR desde 2026 — trocamos por MACOS no proto;
 *  - o banco (wa_conexao) é a fonte de verdade do STATUS; o manager só o
 *    atualiza conforme os eventos do socket;
 *  - socket velho continua emitindo eventos depois de substituído — todo
 *    listener checa se ainda é o socket corrente antes de agir;
 *  - loggedOut apaga a sessão do disco; outros closes reconectam com
 *    backoff exponencial (teto 60s, 10 tentativas).
 */
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { EventEmitter } from 'node:events';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Boom } from '@hapi/boom';
import * as QRCode from 'qrcode';
import type { ConnectionState, WAMessage, WAMessageUpdate, WASocket } from 'baileys';
import { PrismaService } from '../../database/prisma.service';

const RECONEXAO_TETO_MS = 60_000;
const RECONEXAO_MAX = 10;

export type StatusEntrega = 'enviada' | 'entregue' | 'lida' | 'falhou';

export interface EventoStatusMensagem {
  providerMessageId: string;
  status: StatusEntrega;
  codigoErro?: number;
}

let baileysPromise: Promise<typeof import('baileys')> | null = null;
function carregarBaileys(): Promise<typeof import('baileys')> {
  baileysPromise ??= import('baileys')
    .then((baileys) => {
      // Workaround de pareamento (405 antes do QR na plataforma WEB).
      const plataforma = (baileys.proto as unknown as {
        ClientPayload: { UserAgent: { Platform: { WEB?: unknown; MACOS?: unknown } } };
      }).ClientPayload.UserAgent.Platform;
      if (typeof plataforma.MACOS === 'number' && typeof plataforma.WEB === 'number') {
        plataforma.WEB = plataforma.MACOS;
      }
      return baileys;
    })
    .catch((erro: unknown) => {
      baileysPromise = null;
      throw erro;
    });
  return baileysPromise;
}

function mapearAck(status: number | null | undefined): StatusEntrega | null {
  switch (status) {
    case 0: return 'falhou';
    case 2: return 'enviada';
    case 3: return 'entregue';
    case 4:
    case 5: return 'lida';
    default: return null;
  }
}

@Injectable()
export class BaileysManager implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BaileysManager.name);
  private socket: WASocket | null = null;
  private iniciando: Promise<void> | null = null;
  private tentativas = 0;

  /** 'mensagem' (WAMessage crua) e 'status' (EventoStatusMensagem). */
  readonly eventos = new EventEmitter();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private dirSessao(): string {
    const base = this.config.get<string>('WHATSAPP_SESSIONS_DIR') ?? './.whatsapp-sessoes';
    return join(base, 'febrahub');
  }

  async onModuleInit(): Promise<void> {
    // Religa após restart se a conexão estava viva (mesma regra da origem).
    const conexao = await this.prisma.waConexao.findUnique({ where: { id: 1 } });
    if (conexao && ['conectado', 'conectando', 'qr_pendente'].includes(conexao.status)) {
      void this.conectar();
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.socket?.end(undefined);
  }

  get conectado(): boolean {
    return this.socket != null;
  }

  private gravar(dado: Record<string, unknown>): Promise<unknown> {
    return this.prisma.waConexao
      .update({ where: { id: 1 }, data: { ...dado, atualizadoEm: new Date() } })
      .catch((e: unknown) => this.logger.error(`gravar conexão: ${String(e)}`));
  }

  conectar(): Promise<void> {
    if (this.socket) return Promise.resolve();
    if (this.iniciando) return this.iniciando;
    const inicio = this.iniciar()
      .catch(async (erro: unknown) => {
        this.logger.error(`Falha ao iniciar WhatsApp: ${String(erro)}`);
        await this.gravar({
          status: 'erro',
          qrCode: null,
          qrGeradoEm: null,
          ultimoErro: 'Não foi possível iniciar a conexão. Tente novamente.',
        });
      })
      .finally(() => {
        if (this.iniciando === inicio) this.iniciando = null;
      });
    this.iniciando = inicio;
    return inicio;
  }

  private async iniciar(): Promise<void> {
    await this.gravar({ status: 'conectando', ultimoErro: null });

    const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } =
      await carregarBaileys();
    const { state, saveCreds } = await useMultiFileAuthState(this.dirSessao());
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      logger: this.loggerBaileys() as never,
      printQRInTerminal: false,
      browser: ['FebraHub', 'Chrome', '120.0'],
      syncFullHistory: false,
    });
    this.socket = sock;
    const souAtual = () => this.socket === sock;

    sock.ev.on('creds.update', () => void saveCreds());

    sock.ev.on('connection.update', (update: Partial<ConnectionState>) => {
      if (!souAtual()) return;
      void this.aoAtualizarConexao(sock, update);
    });

    sock.ev.on('messages.upsert', ({ messages, type }: { messages: WAMessage[]; type: string }) => {
      if (!souAtual()) return;
      // 'notify' = novas em tempo real; 'append' inclui ecos do próprio envio
      // e mensagens mandadas pelo celular — o consumidor deduplica por key.id.
      if (type !== 'notify' && type !== 'append') return;
      for (const mensagem of messages) this.eventos.emit('mensagem', mensagem);
    });

    sock.ev.on('messages.update', (updates: WAMessageUpdate[]) => {
      if (!souAtual()) return;
      for (const update of updates) {
        const statusNum = (update.update as { status?: number | null })?.status;
        const status = mapearAck(statusNum);
        let codigoErro: number | undefined;
        if (statusNum === 0) {
          const params = (update.update as { messageStubParameters?: unknown }).messageStubParameters;
          if (Array.isArray(params) && params.length > 0) {
            const codigo = Number(params[0]);
            if (Number.isFinite(codigo)) codigoErro = codigo;
          }
        }
        if (status && update.key?.id) {
          const evento: EventoStatusMensagem = {
            providerMessageId: update.key.id,
            status,
            ...(codigoErro !== undefined ? { codigoErro } : {}),
          };
          this.eventos.emit('status', evento);
        }
      }
    });
  }

  private async aoAtualizarConexao(sock: WASocket, update: Partial<ConnectionState>): Promise<void> {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      const qrDataUrl = await QRCode.toDataURL(qr);
      await this.gravar({ status: 'qr_pendente', qrCode: qrDataUrl, qrGeradoEm: new Date() });
      return;
    }

    if (connection === 'open') {
      const jid = sock.user?.id ?? '';
      const usuario = sock.user as { name?: string; notify?: string } | undefined;
      this.tentativas = 0;
      await this.gravar({
        status: 'conectado',
        telefone: jid.split(':')[0]?.split('@')[0] || null,
        nomeExibicao: usuario?.name ?? usuario?.notify ?? null,
        qrCode: null,
        qrGeradoEm: null,
        conectadoEm: new Date(),
        ultimoErro: null,
      });
      return;
    }

    if (connection === 'close') {
      this.socket = null;
      const { DisconnectReason } = await carregarBaileys();
      const codigo = new Boom(lastDisconnect?.error).output?.statusCode;

      if (codigo === Number(DisconnectReason.loggedOut)) {
        await this.limparSessao();
        this.tentativas = 0;
        await this.gravar({
          status: 'desconectado',
          qrCode: null,
          qrGeradoEm: null,
          desconectadoEm: new Date(),
        });
        return;
      }

      this.tentativas += 1;
      if (this.tentativas > RECONEXAO_MAX) {
        await this.gravar({
          status: 'erro',
          ultimoErro: 'Não foi possível reconectar após várias tentativas. Conecte novamente.',
        });
        return;
      }
      const espera = Math.min(1000 * 2 ** this.tentativas, RECONEXAO_TETO_MS);
      this.logger.warn(`WhatsApp caiu (código ${codigo ?? '?'}); reconectando em ${espera}ms (tentativa ${this.tentativas}).`);
      setTimeout(() => void this.conectar(), espera);
    }
  }

  async desconectar(): Promise<void> {
    const sock = this.socket;
    this.socket = null;
    this.tentativas = 0;
    if (sock) {
      try {
        await sock.logout();
      } catch {
        sock.end(undefined);
      }
    }
    await this.limparSessao();
    await this.gravar({
      status: 'desconectado',
      qrCode: null,
      qrGeradoEm: null,
      desconectadoEm: new Date(),
    });
  }

  private async limparSessao(): Promise<void> {
    await rm(this.dirSessao(), { recursive: true, force: true }).catch(() => undefined);
  }

  /* ------------------------- operações de envio ------------------------- */

  private exigirSocket(): WASocket {
    if (!this.socket) throw new Error('WhatsApp não está conectado');
    return this.socket;
  }

  async resolverJid(telefone: string): Promise<string | null> {
    const sock = this.exigirSocket();
    const digitos = telefone.replace(/\D/g, '');
    const resultados = await sock.onWhatsApp(`${digitos}@s.whatsapp.net`);
    const resultado = resultados?.[0];
    return resultado?.exists ? resultado.jid : null;
  }

  async enviarTexto(jid: string, texto: string): Promise<string | null> {
    const sock = this.exigirSocket();
    const enviado = await sock.sendMessage(jid, { text: texto });
    return enviado?.key?.id ?? null;
  }

  /** Baixa a mídia de uma mensagem recebida (Buffer) — o service re-hospeda no MinIO. */
  async baixarMidia(mensagem: WAMessage): Promise<Buffer | null> {
    const { downloadMediaMessage } = await carregarBaileys();
    try {
      const conteudo = await downloadMediaMessage(mensagem, 'buffer', {});
      return Buffer.isBuffer(conteudo) ? conteudo : null;
    } catch (erro) {
      this.logger.warn(`Falha ao baixar mídia: ${String(erro)}`);
      return null;
    }
  }

  /** Logger mínimo compatível com o que o Baileys espera (pino-like). */
  private loggerBaileys() {
    const nulo = () => undefined;
    const logger = {
      level: 'silent',
      trace: nulo, debug: nulo, info: nulo,
      warn: (obj: unknown, msg?: string) => this.logger.warn(msg ?? JSON.stringify(obj)),
      error: (obj: unknown, msg?: string) => this.logger.error(msg ?? JSON.stringify(obj)),
      child: () => logger,
    };
    return logger;
  }
}
