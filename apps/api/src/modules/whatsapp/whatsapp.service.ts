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
import { WhatsappEventos } from './whatsapp.eventos';

const ESCADA: Record<string, number> = { enviando: 0, enviada: 1, entregue: 2, lida: 3 };
const STATUS_CONVERSA = new Set(['aberta', 'pendente', 'fechada']);
const MIDIA_MAX_BYTES = 16 * 1024 * 1024;

const soDigitos = (v: string): string => v.replace(/\D/g, '');

export interface FiltrosConversasWa {
  busca?: string;
  status?: string;
  escopo?: 'todas' | 'minhas' | 'nao_atribuidas';
  naoLidas?: boolean;
  responsavelId?: string;
}

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

interface CitacaoRecebida {
  providerId: string;
  texto: string | null;
}

interface ConteudoNormalizado {
  tipo: 'texto' | 'imagem' | 'video' | 'audio' | 'documento' | 'figurinha' | 'desconhecido';
  texto: string | null;
  temMidia: boolean;
  midiaNome: string | null;
  midiaMime: string | null;
  notaVoz: boolean;
  citacao: CitacaoRecebida | null;
}

/** Trecho legível da mensagem citada (para renderizar a citação). */
function trechoCitado(quoted: Record<string, unknown> | null | undefined): string | null {
  if (!quoted) return null;
  const q = quoted as {
    conversation?: string;
    extendedTextMessage?: { text?: string };
    imageMessage?: { caption?: string };
    videoMessage?: { caption?: string };
    documentMessage?: { fileName?: string };
    audioMessage?: unknown;
    stickerMessage?: unknown;
  };
  return (
    q.conversation ??
    q.extendedTextMessage?.text ??
    q.imageMessage?.caption ??
    (q.imageMessage ? '📷 Imagem' : null) ??
    q.videoMessage?.caption ??
    (q.videoMessage ? '🎬 Vídeo' : null) ??
    (q.audioMessage ? '🎙️ Áudio' : null) ??
    (q.documentMessage ? `📄 ${q.documentMessage.fileName ?? 'Documento'}` : null) ??
    (q.stickerMessage ? '🩵 Figurinha' : null)
  );
}

/** Extrai o conteúdo suportado da mensagem crua (wrappers ephemeral inclusos). */
function normalizarConteudo(mensagem: WAMessage): ConteudoNormalizado | null {
  let m = mensagem.message ?? null;
  if (!m) return null;
  const efemera = (m as { ephemeralMessage?: { message?: typeof m } }).ephemeralMessage?.message;
  if (efemera) m = efemera;

  // Citação (responder mensagem): o contextInfo vive no submessage ativo.
  const ctx = (
    m.extendedTextMessage ?? m.imageMessage ?? m.videoMessage ??
    m.audioMessage ?? m.documentMessage ?? m.stickerMessage
  )?.contextInfo as { stanzaId?: string | null; quotedMessage?: Record<string, unknown> | null } | undefined;
  const citacao: CitacaoRecebida | null = ctx?.stanzaId
    ? { providerId: ctx.stanzaId, texto: trechoCitado(ctx.quotedMessage)?.slice(0, 200) ?? null }
    : null;

  if (m.conversation) return { tipo: 'texto', texto: m.conversation, temMidia: false, midiaNome: null, midiaMime: null, notaVoz: false, citacao };
  if (m.extendedTextMessage?.text) return { tipo: 'texto', texto: m.extendedTextMessage.text, temMidia: false, midiaNome: null, midiaMime: null, notaVoz: false, citacao };
  if (m.imageMessage) return { tipo: 'imagem', texto: m.imageMessage.caption ?? null, temMidia: true, midiaNome: null, midiaMime: m.imageMessage.mimetype ?? 'image/jpeg', notaVoz: false, citacao };
  if (m.videoMessage) return { tipo: 'video', texto: m.videoMessage.caption ?? null, temMidia: true, midiaNome: null, midiaMime: m.videoMessage.mimetype ?? 'video/mp4', notaVoz: false, citacao };
  if (m.audioMessage) return { tipo: 'audio', texto: null, temMidia: true, midiaNome: null, midiaMime: m.audioMessage.mimetype ?? 'audio/ogg', notaVoz: !!m.audioMessage.ptt, citacao };
  if (m.documentMessage) return { tipo: 'documento', texto: m.documentMessage.caption ?? null, temMidia: true, midiaNome: m.documentMessage.fileName ?? null, midiaMime: m.documentMessage.mimetype ?? 'application/octet-stream', notaVoz: false, citacao };
  if (m.stickerMessage) return { tipo: 'figurinha', texto: null, temMidia: true, midiaNome: null, midiaMime: m.stickerMessage.mimetype ?? 'image/webp', notaVoz: false, citacao };
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
    private readonly eventos: WhatsappEventos,
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

    // Citação: se a mensagem original existe localmente, sabemos de quem era.
    let citacaoDeMim: boolean | null = null;
    if (conteudo.citacao) {
      const original = await this.prisma.waMensagem.findFirst({
        where: { providerMessageId: conteudo.citacao.providerId },
        select: { deMim: true },
      });
      citacaoDeMim = original?.deMim ?? null;
    }

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
          citacaoProviderId: conteudo.citacao?.providerId ?? null,
          citacaoTexto: conteudo.citacao?.texto ?? null,
          citacaoDeMim,
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
    this.eventos.emitir({ tipo: 'mensagem', conversaId: conversa.id });
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
      this.eventos.emitir({ tipo: 'mensagem', conversaId: mensagem.conversaId });
      return;
    }
    // Escada só para frente: um 'entregue' atrasado não regride uma 'lida'.
    if ((ESCADA[evento.status] ?? 0) <= (ESCADA[mensagem.status] ?? 0)) return;
    await this.prisma.waMensagem.update({ where: { id: mensagem.id }, data: { status: evento.status } });
    this.eventos.emitir({ tipo: 'mensagem', conversaId: mensagem.conversaId });
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

  /** Lista com os filtros da origem: escopo (todas/minhas/não atribuídas),
   *  situação, só não-lidas e busca server-side por nome/telefone/última
   *  mensagem/cliente do CRM. */
  async conversas(usuario: UsuarioLogado, filtros: FiltrosConversasWa = {}) {
    const where: Record<string, unknown> = { excluidaEm: null };
    if (filtros.status && STATUS_CONVERSA.has(filtros.status)) where.status = filtros.status;
    if (filtros.escopo === 'minhas') where.atribuidaA = usuario.id;
    if (filtros.escopo === 'nao_atribuidas') where.atribuidaA = null;
    if (filtros.responsavelId) where.atribuidaA = filtros.responsavelId;
    if (filtros.naoLidas) where.naoLidas = { gt: 0 };
    const termo = filtros.busca?.trim();
    if (termo) {
      where.OR = [
        { nomeContato: { contains: termo, mode: 'insensitive' } },
        { telefone: { contains: soDigitos(termo) || termo } },
        { ultimaMsg: { contains: termo, mode: 'insensitive' } },
        { crmCliente: { nome: { contains: termo, mode: 'insensitive' } } },
      ];
    }
    return this.prisma.waConversa.findMany({
      where,
      include: { crmCliente: { select: { id: true, nome: true, estagio: true } } },
      orderBy: [{ ultimaMsgEm: { sort: 'desc', nulls: 'last' } }],
      take: 200,
    });
  }

  /** Situação da conversa (aberta → pendente → fechada), como a origem. */
  async mudarStatus(usuario: UsuarioLogado, conversaId: string, status: string) {
    if (!STATUS_CONVERSA.has(status)) {
      throw new BadRequestException({ codigo: 'STATUS_INVALIDO', message: 'Situação desconhecida' });
    }
    const conversa = await this.prisma.waConversa.findUnique({ where: { id: conversaId } });
    if (!conversa) throw new NotFoundException({ codigo: 'CONVERSA_DESCONHECIDA', message: 'Conversa não encontrada' });
    const atualizada = await this.prisma.waConversa.update({
      where: { id: conversaId },
      data: { status },
      include: { crmCliente: { select: { id: true, nome: true, estagio: true } } },
    });
    await this.trilha(usuario, `wa_status_${conversa.status}->${status}`, conversaId);
    this.eventos.emitir({ tipo: 'conversa', conversaId });
    return atualizada;
  }

  /** Atribui (ou tira) o responsável humano pela conversa. */
  async atribuir(usuario: UsuarioLogado, conversaId: string, responsavelId: string | null) {
    const conversa = await this.prisma.waConversa.findUnique({ where: { id: conversaId } });
    if (!conversa) throw new NotFoundException({ codigo: 'CONVERSA_DESCONHECIDA', message: 'Conversa não encontrada' });
    let nome: string | null = null;
    if (responsavelId) {
      const responsavel = await this.prisma.usuario.findUnique({
        where: { id: responsavelId },
        select: { nome: true, ativo: true },
      });
      if (!responsavel?.ativo) {
        throw new BadRequestException({ codigo: 'RESPONSAVEL_INVALIDO', message: 'Usuário indisponível' });
      }
      nome = responsavel.nome;
    }
    const atualizada = await this.prisma.waConversa.update({
      where: { id: conversaId },
      data: { atribuidaA: responsavelId, atribuidaNome: nome },
      include: { crmCliente: { select: { id: true, nome: true, estagio: true } } },
    });
    await this.trilha(usuario, responsavelId ? 'wa_atribuida' : 'wa_desatribuida', conversaId);
    this.eventos.emitir({ tipo: 'conversa', conversaId });
    return atualizada;
  }

  private async trilha(usuario: UsuarioLogado, acao: string, conversaId: string) {
    await this.prisma.auditoriaAcesso
      .create({
        data: { usuarioId: usuario.id, acao: acao.slice(0, 80), recurso: `whatsapp/conversas/${conversaId}` },
      })
      .catch(() => undefined);
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

  async enviar(usuario: UsuarioLogado, conversaId: string, texto: string, citacaoProviderId?: string) {
    const conversa = await this.prisma.waConversa.findUnique({ where: { id: conversaId } });
    if (!conversa) throw new NotFoundException({ codigo: 'CONVERSA_DESCONHECIDA', message: 'Conversa não encontrada' });
    if (!this.manager.conectado) {
      throw new BadRequestException({ codigo: 'WHATSAPP_DESCONECTADO', message: 'Conecte o WhatsApp na tela de Integrações' });
    }
    const jid = conversa.jid ?? `${conversa.telefone}@s.whatsapp.net`;

    // Citação local: renderiza a referência na bolha. (O quote NATIVO do
    // WhatsApp exige a mensagem crua original, que não guardamos — limite
    // documentado; o contato não vê a citação, o operador sim.)
    let citacao: { providerId: string; texto: string | null; deMim: boolean } | null = null;
    if (citacaoProviderId) {
      const original = await this.prisma.waMensagem.findFirst({
        where: { providerMessageId: citacaoProviderId, conversaId },
        select: { texto: true, tipoConteudo: true, deMim: true, midiaNome: true },
      });
      if (original) {
        const trecho = original.texto ?? ({ imagem: '📷 Imagem', video: '🎬 Vídeo', audio: '🎙️ Áudio', documento: `📄 ${original.midiaNome ?? 'Documento'}`, figurinha: '🩵 Figurinha' } as Record<string, string>)[original.tipoConteudo] ?? '[mensagem]';
        citacao = { providerId: citacaoProviderId, texto: trecho.slice(0, 200), deMim: original.deMim };
      }
    }

    const registro = await this.prisma.waMensagem.create({
      data: {
        conversaId,
        direcao: 'saida',
        tipoRemetente: 'operador',
        operadorId: usuario.id,
        tipoConteudo: 'texto',
        texto,
        citacaoProviderId: citacao?.providerId ?? null,
        citacaoTexto: citacao?.texto ?? null,
        citacaoDeMim: citacao?.deMim ?? null,
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
      this.eventos.emitir({ tipo: 'mensagem', conversaId });
      return atualizado;
    } catch (erro) {
      const falha = await this.prisma.waMensagem.update({
        where: { id: registro.id },
        data: { status: 'falhou', erro: String(erro).slice(0, 300) },
      });
      this.eventos.emitir({ tipo: 'mensagem', conversaId });
      return falha;
    }
  }

  /** Envia mídia (imagem/vídeo/áudio/documento; nota de voz com ptt) — o
   *  arquivo vai para o MinIO E para o WhatsApp; a bolha usa a nossa cópia. */
  async enviarMidia(
    usuario: UsuarioLogado,
    conversaId: string,
    arquivo: { nome: string; mime: string; dados: Buffer },
    legenda?: string,
    notaVoz?: boolean,
  ) {
    const conversa = await this.prisma.waConversa.findUnique({ where: { id: conversaId } });
    if (!conversa) throw new NotFoundException({ codigo: 'CONVERSA_DESCONHECIDA', message: 'Conversa não encontrada' });
    if (!this.manager.conectado) {
      throw new BadRequestException({ codigo: 'WHATSAPP_DESCONECTADO', message: 'Conecte o WhatsApp na tela de Integrações' });
    }
    if (arquivo.dados.length > MIDIA_MAX_BYTES) {
      throw new BadRequestException({ codigo: 'MIDIA_GRANDE', message: 'Arquivo passa de 16 MB (limite do WhatsApp)' });
    }
    const jid = conversa.jid ?? `${conversa.telefone}@s.whatsapp.net`;
    const mime = arquivo.mime || 'application/octet-stream';
    const tipo = mime.startsWith('image/') ? 'imagem'
      : mime.startsWith('video/') ? 'video'
      : mime.startsWith('audio/') ? 'audio'
      : 'documento';

    const registro = await this.prisma.waMensagem.create({
      data: {
        conversaId,
        direcao: 'saida',
        tipoRemetente: 'operador',
        operadorId: usuario.id,
        tipoConteudo: tipo,
        texto: legenda?.trim() || null,
        midiaNome: arquivo.nome,
        midiaMime: mime,
        midiaTamanho: arquivo.dados.length,
        midiaNotaVoz: !!notaVoz,
        remoteJid: jid,
        deMim: true,
        status: 'enviando',
      },
    });

    const midiaChave = `whatsapp/${conversaId}/out-${registro.id}`;
    await this.storage.upload(midiaChave, arquivo.dados, mime).catch((e: unknown) => {
      this.logger.warn(`upload local da mídia enviada falhou: ${String(e)}`);
    });

    const previa = legenda?.trim()
      || ({ imagem: '📷 Imagem', video: '🎬 Vídeo', audio: notaVoz ? '🎙️ Áudio' : '🎵 Áudio', documento: `📄 ${arquivo.nome}` } as Record<string, string>)[tipo]
      || '[mídia]';

    try {
      const providerId = await this.manager.enviarMidia(jid, arquivo.dados, mime, arquivo.nome, {
        legenda,
        notaVoz,
      });
      const atualizado = await this.prisma.waMensagem.update({
        where: { id: registro.id },
        data: { providerMessageId: providerId, midiaChave, status: 'enviada' },
      });
      await this.prisma.waConversa.update({
        where: { id: conversaId },
        data: { ultimaMsg: previa.slice(0, 200), ultimaMsgEm: new Date() },
      });
      await this.trilha(usuario, `wa_midia_${tipo}`, conversaId);
      this.eventos.emitir({ tipo: 'mensagem', conversaId });
      return atualizado;
    } catch (erro) {
      const falha = await this.prisma.waMensagem.update({
        where: { id: registro.id },
        data: { midiaChave, status: 'falhou', erro: String(erro).slice(0, 300) },
      });
      this.eventos.emitir({ tipo: 'mensagem', conversaId });
      return falha;
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

  /**
   * Envio PROATIVO iniciado pelo sistema (sem UsuarioLogado) — a régua da Loja
   * (pagamento confirmado, é o próximo, em preparação, pronto) avisa o cliente
   * pelo WhatsApp corporativo.
   *
   * É BEST-EFFORT por decisão: nunca lança. A venda/pedido não pode quebrar
   * porque o número não tem WhatsApp, a conta está restrita (463) ou a sessão
   * caiu. Devolve `{ enviado, motivo? }` para quem quiser registrar/observar.
   * Quando há sessão conectada, também espelha a bolha na conversa (para o
   * atendimento ver o que foi disparado).
   */
  async enviarProativo(
    telefone: string,
    texto: string,
  ): Promise<{ enviado: boolean; motivo?: string }> {
    const digitos = soDigitos(telefone ?? '');
    if (digitos.length < 8) return { enviado: false, motivo: 'telefone_invalido' };
    if (!this.manager.conectado) return { enviado: false, motivo: 'whatsapp_desconectado' };

    try {
      const jid = await this.manager.resolverJid(digitos);
      if (!jid) return { enviado: false, motivo: 'sem_whatsapp' };

      const providerId = await this.manager.enviarTexto(jid, texto);

      // Espelha na conversa (achada/criada pelo telefone) para o inbox mostrar.
      // Falha aqui não invalida o envio — a mensagem já saiu.
      try {
        const telNorm = digitos;
        let conversa = await this.prisma.waConversa.findFirst({ where: { telefone: telNorm } });
        if (!conversa) {
          conversa = await this.prisma.waConversa.create({
            data: { telefone: telNorm, jid, status: 'aberta' },
          });
        }
        await this.prisma.waMensagem.create({
          data: {
            conversaId: conversa.id,
            direcao: 'saida',
            tipoRemetente: 'sistema',
            tipoConteudo: 'texto',
            texto,
            remoteJid: jid,
            providerMessageId: providerId,
            deMim: true,
            status: providerId ? 'enviada' : 'enviando',
          },
        });
        await this.prisma.waConversa.update({
          where: { id: conversa.id },
          data: { ultimaMsg: texto.slice(0, 200), ultimaMsgEm: new Date() },
        });
        this.eventos.emitir({ tipo: 'mensagem', conversaId: conversa.id });
      } catch (erroEspelho) {
        this.logger.warn(`enviarProativo: falha ao espelhar bolha — ${String(erroEspelho).slice(0, 200)}`);
      }

      return { enviado: true };
    } catch (erro) {
      this.logger.warn(`enviarProativo: falha no envio — ${String(erro).slice(0, 200)}`);
      return { enviado: false, motivo: 'erro_envio' };
    }
  }
}
