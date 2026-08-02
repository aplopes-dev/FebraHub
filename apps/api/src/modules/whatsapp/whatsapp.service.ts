/**
 * WhatsApp — pipeline e operações, porte single-tenant do módulo
 * conversations do crm-aplopes.
 *
 * Entrada (evento 'mensagem' do manager):
 *   1. só conversa DIRETA no v1 (grupo/status/newsletter são ignorados —
 *      registrado em docs/INTEGRACAO_HUB_CRM.md);
 *   2. dedupe por key.id (eco do próprio envio, reentrega e mensagem mandada
 *      pelo celular chegam todas por aqui);
 *   3. conversa achada/criada pelo TELEFONE normalizado; na criação tenta o
 *      vínculo automático com o CRM pelos últimos 8 dígitos (a regra de
 *      ponte por telefone do projeto);
 *   4. mídia é baixada do WhatsApp e RE-HOSPEDADA no MinIO — o link do
 *      WhatsApp expira, o nosso não;
 *   5. não-lidas e última mensagem atualizam a lista.
 *
 * Status ('status'): escada só para frente (enviada→entregue→lida); 'falhou'
 * entra a qualquer momento com a mensagem acionável (463 = restrição de
 * iniciar conversas novas, herdada da origem).
 */
import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import type { WAMessage } from 'baileys';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { BaileysManager, type EventoStatusMensagem } from './baileys.manager';

const ESCADA: Record<string, number> = { enviando: 0, enviada: 1, entregue: 2, lida: 3 };

const soDigitos = (v: string): string => v.replace(/\D/g, '');

function mensagemFalha463(codigo?: number): string {
  if (codigo === 463) {
    return (
      'Conta temporariamente restrita pelo WhatsApp para INICIAR conversas novas ' +
      '(erro 463). Responder conversas existentes continua funcionando — peça para ' +
      'o contato mandar a primeira mensagem. A restrição expira sozinha.'
    );
  }
  return 'Falha reportada pelo WhatsApp';
}

interface ConteudoNormalizado {
  tipo: 'texto' | 'imagem' | 'video' | 'audio' | 'documento' | 'figurinha' | 'desconhecido';
  texto: string | null;
  temMidia: boolean;
  midiaNome: string | null;
  midiaMime: string | null;
  notaVoz: boolean;
}

/** Extrai o conteúdo suportado da mensagem crua (wrappers ephemeral inclusos). */
function normalizarConteudo(mensagem: WAMessage): ConteudoNormalizado | null {
  let m = mensagem.message ?? null;
  if (!m) return null;
  const efemera = (m as { ephemeralMessage?: { message?: typeof m } }).ephemeralMessage?.message;
  if (efemera) m = efemera;

  if (m.conversation) return { tipo: 'texto', texto: m.conversation, temMidia: false, midiaNome: null, midiaMime: null, notaVoz: false };
  if (m.extendedTextMessage?.text) return { tipo: 'texto', texto: m.extendedTextMessage.text, temMidia: false, midiaNome: null, midiaMime: null, notaVoz: false };
  if (m.imageMessage) return { tipo: 'imagem', texto: m.imageMessage.caption ?? null, temMidia: true, midiaNome: null, midiaMime: m.imageMessage.mimetype ?? 'image/jpeg', notaVoz: false };
  if (m.videoMessage) return { tipo: 'video', texto: m.videoMessage.caption ?? null, temMidia: true, midiaNome: null, midiaMime: m.videoMessage.mimetype ?? 'video/mp4', notaVoz: false };
  if (m.audioMessage) return { tipo: 'audio', texto: null, temMidia: true, midiaNome: null, midiaMime: m.audioMessage.mimetype ?? 'audio/ogg', notaVoz: !!m.audioMessage.ptt };
  if (m.documentMessage) return { tipo: 'documento', texto: m.documentMessage.caption ?? null, temMidia: true, midiaNome: m.documentMessage.fileName ?? null, midiaMime: m.documentMessage.mimetype ?? 'application/octet-stream', notaVoz: false };
  if (m.stickerMessage) return { tipo: 'figurinha', texto: null, temMidia: true, midiaNome: null, midiaMime: m.stickerMessage.mimetype ?? 'image/webp', notaVoz: false };
  // Reações, edições, revogações, enquetes etc.: fora do v1.
  return null;
}

@Injectable()
export class WhatsappService implements OnModuleInit {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly manager: BaileysManager,
    private readonly storage: StorageService,
  ) {}

  onModuleInit(): void {
    this.manager.eventos.on('mensagem', (mensagem: WAMessage) => {
      this.processarEntrada(mensagem).catch((e: unknown) =>
        this.logger.error(`entrada WhatsApp: ${String(e)}`),
      );
    });
    this.manager.eventos.on('status', (evento: EventoStatusMensagem) => {
      this.processarStatus(evento).catch((e: unknown) =>
        this.logger.error(`status WhatsApp: ${String(e)}`),
      );
    });
  }

  /* --------------------------- entrada --------------------------- */

  private async processarEntrada(mensagem: WAMessage): Promise<void> {
    const jid = mensagem.key?.remoteJid ?? '';
    const providerId = mensagem.key?.id ?? null;
    if (!providerId) return;
    // v1: só DM. @lid traz o telefone real em remoteJidAlt.
    const jidAlt = (mensagem.key as { remoteJidAlt?: string } | undefined)?.remoteJidAlt;
    const jidReal = jid.endsWith('@lid') && jidAlt ? jidAlt : jid;
    if (!jidReal.endsWith('@s.whatsapp.net')) return;

    const conteudo = normalizarConteudo(mensagem);
    if (!conteudo) return;

    // Dedupe: eco do envio próprio (fromMe) já persistido pelo enviar().
    const existente = await this.prisma.waMensagem.findFirst({ where: { providerMessageId: providerId } });
    if (existente) return;

    const telefone = soDigitos(jidReal.split('@')[0] ?? '');
    if (!telefone) return;
    const deMim = !!mensagem.key?.fromMe;
    const nomeContato = mensagem.pushName ?? null;

    const conversa = await this.acharOuCriarConversa(telefone, jidReal, deMim ? null : nomeContato);

    // Mídia: baixa do WhatsApp e re-hospeda no MinIO.
    let midiaChave: string | null = null;
    let midiaTamanho: number | null = null;
    if (conteudo.temMidia) {
      const buffer = await this.manager.baixarMidia(mensagem);
      if (buffer) {
        midiaChave = `whatsapp/${conversa.id}/${providerId}`;
        midiaTamanho = buffer.length;
        await this.storage
          .upload(midiaChave, buffer, conteudo.midiaMime ?? 'application/octet-stream')
          .catch((e: unknown) => {
            this.logger.warn(`upload de mídia falhou: ${String(e)}`);
            midiaChave = null;
            midiaTamanho = null;
          });
      }
    }

    const previa =
      conteudo.texto ??
      ({ imagem: '📷 Imagem', video: '🎬 Vídeo', audio: conteudo.notaVoz ? '🎙️ Áudio' : '🎵 Áudio', documento: `📄 ${conteudo.midiaNome ?? 'Documento'}`, figurinha: '🩵 Figurinha' } as Record<string, string>)[conteudo.tipo] ??
      '[mensagem]';

    await this.prisma.$transaction([
      this.prisma.waMensagem.create({
        data: {
          conversaId: conversa.id,
          direcao: deMim ? 'saida' : 'entrada',
          tipoRemetente: deMim ? 'operador' : 'contato',
          tipoConteudo: conteudo.tipo,
          texto: conteudo.texto,
          midiaChave,
          midiaNome: conteudo.midiaNome,
          midiaMime: midiaChave ? conteudo.midiaMime : null,
          midiaTamanho,
          midiaNotaVoz: conteudo.notaVoz,
          providerMessageId: providerId,
          remoteJid: jidReal,
          deMim,
          status: deMim ? 'enviada' : 'lida',
        },
      }),
      this.prisma.waConversa.update({
        where: { id: conversa.id },
        data: {
          ultimaMsg: previa.slice(0, 200),
          ultimaMsgEm: new Date(),
          ...(deMim ? {} : { naoLidas: { increment: 1 }, status: 'aberta', excluidaEm: null }),
          ...(nomeContato && !deMim ? { nomeContato } : {}),
        },
      }),
    ]);
  }

  private async acharOuCriarConversa(telefone: string, jid: string, nomeContato: string | null) {
    const atual = await this.prisma.waConversa.findUnique({ where: { telefone } });
    if (atual) return atual;
    // Vínculo automático com o CRM pelos últimos 8 dígitos — a mesma ponte
    // por telefone usada no resto do projeto.
    const sufixo = telefone.slice(-8);
    const cliente =
      (await this.prisma.crmCliente.findFirst({
        where: { telefone: { endsWith: sufixo } },
        select: { id: true, nome: true },
      })) ??
      (await this.prisma.crmClienteContato
        .findFirst({ where: { telefone: { endsWith: sufixo } }, select: { cliente: { select: { id: true, nome: true } } } })
        .then((c) => c?.cliente ?? null));
    return this.prisma.waConversa.create({
      data: {
        telefone,
        jid,
        nomeContato: nomeContato ?? cliente?.nome ?? null,
        crmClienteId: cliente?.id ?? null,
      },
    });
  }

  private async processarStatus(evento: EventoStatusMensagem): Promise<void> {
    const mensagem = await this.prisma.waMensagem.findFirst({
      where: { providerMessageId: evento.providerMessageId },
    });
    if (!mensagem) return;
    if (evento.status === 'falhou') {
      await this.prisma.waMensagem.update({
        where: { id: mensagem.id },
        data: { status: 'falhou', erro: mensagemFalha463(evento.codigoErro) },
      });
      return;
    }
    // Escada só para frente: um 'entregue' atrasado não regride uma 'lida'.
    if ((ESCADA[evento.status] ?? 0) <= (ESCADA[mensagem.status] ?? 0)) return;
    await this.prisma.waMensagem.update({ where: { id: mensagem.id }, data: { status: evento.status } });
  }

  /* ------------------------------ API ------------------------------ */

  status() {
    return this.prisma.waConexao.findUnique({ where: { id: 1 } });
  }

  async conectar() {
    await this.manager.conectar();
    return this.status();
  }

  async desconectar() {
    await this.manager.desconectar();
    return this.status();
  }

  async conversas() {
    const linhas = await this.prisma.waConversa.findMany({
      where: { excluidaEm: null },
      include: { crmCliente: { select: { id: true, nome: true, estagio: true } } },
      orderBy: [{ ultimaMsgEm: { sort: 'desc', nulls: 'last' } }],
      take: 200,
    });
    return linhas;
  }

  async mensagens(conversaId: string, marcarLidas: boolean) {
    const conversa = await this.prisma.waConversa.findUnique({
      where: { id: conversaId },
      include: { crmCliente: { select: { id: true, nome: true, estagio: true } } },
    });
    if (!conversa) throw new NotFoundException({ codigo: 'CONVERSA_DESCONHECIDA', message: 'Conversa não encontrada' });
    const mensagens = await this.prisma.waMensagem.findMany({
      where: { conversaId },
      orderBy: { criadoEm: 'asc' },
      take: 300,
    });
    if (marcarLidas && conversa.naoLidas > 0) {
      await this.prisma.waConversa.update({ where: { id: conversaId }, data: { naoLidas: 0 } });
    }
    return { conversa, mensagens };
  }

  async enviar(usuario: UsuarioLogado, conversaId: string, texto: string) {
    const conversa = await this.prisma.waConversa.findUnique({ where: { id: conversaId } });
    if (!conversa) throw new NotFoundException({ codigo: 'CONVERSA_DESCONHECIDA', message: 'Conversa não encontrada' });
    if (!this.manager.conectado) {
      throw new BadRequestException({ codigo: 'WHATSAPP_DESCONECTADO', message: 'Conecte o WhatsApp na tela de Integrações' });
    }
    const jid = conversa.jid ?? `${conversa.telefone}@s.whatsapp.net`;

    const registro = await this.prisma.waMensagem.create({
      data: {
        conversaId,
        direcao: 'saida',
        tipoRemetente: 'operador',
        operadorId: usuario.id,
        tipoConteudo: 'texto',
        texto,
        remoteJid: jid,
        deMim: true,
        status: 'enviando',
      },
    });
    try {
      const providerId = await this.manager.enviarTexto(jid, texto);
      const atualizado = await this.prisma.waMensagem.update({
        where: { id: registro.id },
        data: { providerMessageId: providerId, status: 'enviada' },
      });
      await this.prisma.waConversa.update({
        where: { id: conversaId },
        data: { ultimaMsg: texto.slice(0, 200), ultimaMsgEm: new Date() },
      });
      return atualizado;
    } catch (erro) {
      return this.prisma.waMensagem.update({
        where: { id: registro.id },
        data: { status: 'falhou', erro: String(erro).slice(0, 300) },
      });
    }
  }

  /** Vincula a conversa a um cliente do CRM — ou cria um lead PF a partir dela. */
  async vincularCliente(usuario: UsuarioLogado, conversaId: string, clienteId: string | null, criarNovo: boolean) {
    const conversa = await this.prisma.waConversa.findUnique({ where: { id: conversaId } });
    if (!conversa) throw new NotFoundException({ codigo: 'CONVERSA_DESCONHECIDA', message: 'Conversa não encontrada' });

    let idFinal = clienteId;
    if (criarNovo) {
      const cliente = await this.prisma.crmCliente.create({
        data: {
          nome: conversa.nomeContato ?? conversa.telefone,
          tipoPessoa: 'pf',
          telefone: conversa.telefone,
          origem: 'whatsapp',
          criadoPor: usuario.id,
          responsavelId: usuario.id,
        },
      });
      idFinal = cliente.id;
    }
    return this.prisma.waConversa.update({
      where: { id: conversaId },
      data: { crmClienteId: idFinal },
      include: { crmCliente: { select: { id: true, nome: true, estagio: true } } },
    });
  }

  async urlMidia(mensagemId: string): Promise<{ url: string }> {
    const mensagem = await this.prisma.waMensagem.findUnique({ where: { id: mensagemId } });
    if (!mensagem?.midiaChave) throw new NotFoundException({ codigo: 'SEM_MIDIA', message: 'Mensagem sem mídia' });
    const url = await this.storage.urlAssinada(mensagem.midiaChave, 600, mensagem.midiaNome ?? undefined);
    return { url };
  }

  totalNaoLidas() {
    return this.prisma.waConversa
      .aggregate({ where: { excluidaEm: null }, _sum: { naoLidas: true } })
      .then((r) => ({ total: r._sum.naoLidas ?? 0 }));
  }
}
