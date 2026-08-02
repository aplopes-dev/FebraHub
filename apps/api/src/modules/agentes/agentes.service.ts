/**
 * Agentes de IA — a ponte com a plataforma Aplopes AI, portada do módulo
 * teams do crm-aplopes para tenant único.
 *
 * O motor de IA é EXTERNO. Este módulo faz quatro coisas:
 *  1. PAREAMENTO: o admin gera um token fhk_live_… e cola no Aplopes; a
 *     plataforma lê /.well-known/aplopes-integration (autenticado pelo
 *     token), chama /api/agentes/pair entregando o aplopes_token e o
 *     webhook_secret, e este serviço puxa a lista de agentes. Os segredos
 *     ficam cifrados (AES-256-GCM, chave em env), nunca em claro.
 *  2. CONVERSAS: criar issue remota (Idempotency-Key = ref externa),
 *     enviar mensagem no thread remoto, espelhar tudo localmente.
 *  3. WEBHOOK: eventos assinados (HMAC sha256 de `timestamp.rawBody`,
 *     headers x-alook-*) com outbox de idempotência e janela anti-replay.
 *  4. RECONCILIAÇÃO: poll a cada minuto puxa mensagens/status das conversas
 *     abertas — o loop fecha mesmo sem o webhook configurado do outro lado.
 */
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';
import { PrismaService } from '../../database/prisma.service';
import { UsuarioLogado } from '../../common/decorators/usuario.decorator';

const JANELA_WEBHOOK_MS = 5 * 60 * 1000;
const ESTADOS_FINAIS = new Set(['CONCLUIDA', 'CANCELADA', 'ERRO']);

/* ------------------------- cifra AES-256-GCM ------------------------- */

function chaveDe(config: ConfigService): Buffer {
  const bruta = config.get<string>('AGENTES_CHAVE_CIFRA');
  if (!bruta) throw new Error('AGENTES_CHAVE_CIFRA ausente no ambiente');
  const chave = Buffer.from(bruta, 'base64');
  if (chave.length !== 32) throw new Error('AGENTES_CHAVE_CIFRA deve ter 32 bytes em base64');
  return chave;
}

export function cifrar(config: ConfigService, claro: string): string {
  const chave = chaveDe(config);
  const iv = randomBytes(12);
  const cifra = createCipheriv('aes-256-gcm', chave, iv);
  const dados = Buffer.concat([cifra.update(claro, 'utf8'), cifra.final()]);
  return Buffer.concat([iv, cifra.getAuthTag(), dados]).toString('base64');
}

export function decifrar(config: ConfigService, cifrado: string): string {
  const chave = chaveDe(config);
  const bruto = Buffer.from(cifrado, 'base64');
  const iv = bruto.subarray(0, 12);
  const tag = bruto.subarray(12, 28);
  const dados = bruto.subarray(28);
  const decifra = createDecipheriv('aes-256-gcm', chave, iv);
  decifra.setAuthTag(tag);
  return Buffer.concat([decifra.update(dados), decifra.final()]).toString('utf8');
}

const sha256hex = (v: string): string => createHash('sha256').update(v).digest('hex');

/* --------------------------- cliente remoto --------------------------- */

interface RequisicaoRemota {
  metodo: 'GET' | 'POST';
  caminho: string;
  token: string;
  baseUrl: string;
  corpo?: unknown;
  cabecalhos?: Record<string, string>;
}

async function chamarAplopes<T>(req: RequisicaoRemota): Promise<T> {
  const base = req.baseUrl.replace(/\/$/, '');
  const resposta = await fetch(`${base}/api${req.caminho}`, {
    method: req.metodo,
    headers: {
      Authorization: `Bearer ${req.token}`,
      Accept: 'application/json',
      ...(req.corpo !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...req.cabecalhos,
    },
    body: req.corpo !== undefined ? JSON.stringify(req.corpo) : undefined,
    signal: AbortSignal.timeout(30_000),
  });
  if (!resposta.ok) {
    const texto = await resposta.text().catch(() => '');
    throw new BadRequestException({
      codigo: 'APLOPES_ERRO',
      message: `Plataforma de agentes respondeu ${resposta.status}: ${texto.slice(0, 200)}`,
    });
  }
  return (await resposta.json().catch(() => ({}))) as T;
}

/* ------------------------------ serviço ------------------------------ */

@Injectable()
export class AgentesService {
  private readonly logger = new Logger(AgentesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private conexao() {
    return this.prisma.agentesConexao.findUnique({ where: { id: 1 } });
  }

  private async conexaoPareada() {
    const conexao = await this.conexao();
    if (!conexao || conexao.status !== 'pareado' || !conexao.tokenCifrado || !conexao.baseUrl || !conexao.workspaceId) {
      throw new BadRequestException({ codigo: 'NAO_PAREADO', message: 'Conecte a plataforma de agentes na tela de Integrações' });
    }
    return {
      ...conexao,
      token: decifrar(this.config, conexao.tokenCifrado),
      baseUrl: conexao.baseUrl,
      workspaceId: conexao.workspaceId,
    };
  }

  /* ---------------------------- pareamento ---------------------------- */

  async statusConexao() {
    const conexao = await this.conexao();
    if (!conexao) return null;
    // Nenhum segredo sai daqui — só o estado.
    return {
      status: conexao.status,
      workspaceId: conexao.workspaceId,
      workspaceNome: conexao.workspaceNome,
      baseUrl: conexao.baseUrl,
      agentePadraoNome: conexao.agentePadraoNome,
      pareadoEm: conexao.pareadoEm,
      sincronizadoEm: conexao.sincronizadoEm,
      temTokenConexao: !!conexao.tokenConexaoHash,
    };
  }

  /** Gera o token que o admin cola no Aplopes. Só o hash fica no banco. */
  async gerarTokenConexao(usuario: UsuarioLogado, ip?: string): Promise<{ token: string }> {
    const token = `fhk_live_${randomBytes(24).toString('hex')}`;
    await this.prisma.agentesConexao.update({
      where: { id: 1 },
      data: { tokenConexaoHash: sha256hex(token), tokenGeradoEm: new Date(), atualizadoEm: new Date() },
    });
    await this.prisma.auditoriaAcesso
      .create({ data: { usuarioId: usuario.id, acao: 'agentes_token_gerado', recurso: 'agentes/conexao', ip } })
      .catch(() => undefined);
    return { token };
  }

  private async validarTokenConexao(authorization: string | undefined): Promise<void> {
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;
    const conexao = await this.conexao();
    if (!token || !conexao?.tokenConexaoHash) {
      throw new UnauthorizedException({ codigo: 'TOKEN_INVALIDO', message: 'Token de conexão inválido' });
    }
    const recebido = Buffer.from(sha256hex(token));
    const esperado = Buffer.from(conexao.tokenConexaoHash);
    if (recebido.length !== esperado.length || !timingSafeEqual(recebido, esperado)) {
      throw new UnauthorizedException({ codigo: 'TOKEN_INVALIDO', message: 'Token de conexão inválido' });
    }
  }

  /** Manifesto lido pela plataforma ao colar o token (autenticado por ele). */
  async manifesto(authorization: string | undefined, urlPublica: string) {
    await this.validarTokenConexao(authorization);
    return {
      name: 'FebraHub',
      description: 'Central de inteligência da Febracis Salvador',
      pair_callback: `${urlPublica}/api/agentes/pair`,
      events: { webhook_url: `${urlPublica}/api/agentes/webhook` },
    };
  }

  /** Callback do pareamento: a plataforma entrega o token dela e o segredo do webhook. */
  async parear(
    authorization: string | undefined,
    dto: { aplopes_token: string; aplopes_base_url: string; webhook_secret: string; workspace_id: string; workspace_name?: string },
  ) {
    await this.validarTokenConexao(authorization);
    if (!dto.aplopes_token || !dto.aplopes_base_url || !dto.workspace_id) {
      throw new BadRequestException({ codigo: 'PAREAMENTO_INCOMPLETO', message: 'Campos obrigatórios ausentes' });
    }
    const agentes = await this.puxarAgentes(dto.aplopes_base_url, dto.aplopes_token);
    const padrao = agentes.find((a) => !a.orquestrador) ?? agentes[0] ?? null;

    await this.prisma.agentesConexao.update({
      where: { id: 1 },
      data: {
        workspaceId: dto.workspace_id,
        workspaceNome: dto.workspace_name ?? null,
        baseUrl: dto.aplopes_base_url.replace(/\/$/, ''),
        tokenCifrado: cifrar(this.config, dto.aplopes_token),
        webhookSecretCifrado: dto.webhook_secret ? cifrar(this.config, dto.webhook_secret) : null,
        agentePadraoId: padrao?.id ?? null,
        agentePadraoNome: padrao?.nome ?? null,
        status: 'pareado',
        pareadoEm: new Date(),
        atualizadoEm: new Date(),
      },
    });
    return { ok: true, agents: agentes.length };
  }

  private async puxarAgentes(baseUrl: string, token: string) {
    const resposta = await chamarAplopes<unknown>({ metodo: 'GET', caminho: '/agents', token, baseUrl });
    const lista = Array.isArray(resposta)
      ? resposta
      : ((resposta as { agents?: unknown[] }).agents ?? (resposta as { data?: unknown[] }).data ?? []);
    return (lista as Record<string, unknown>[]).map((a) => ({
      id: String(a.id ?? ''),
      nome: String(a.name ?? a.nome ?? a.id ?? ''),
      funcao: (a.role ?? a.description ?? null) as string | null,
      orquestrador: !!(a.is_orchestrator ?? a.orchestrator),
    }));
  }

  async listarAgentes() {
    const conexao = await this.conexaoPareada();
    return this.puxarAgentes(conexao.baseUrl, conexao.token);
  }

  async desparear(usuario: UsuarioLogado, ip?: string) {
    await this.prisma.agentesConexao.update({
      where: { id: 1 },
      data: {
        status: 'desconectado',
        tokenCifrado: null,
        webhookSecretCifrado: null,
        workspaceId: null,
        workspaceNome: null,
        baseUrl: null,
        agentePadraoId: null,
        agentePadraoNome: null,
        atualizadoEm: new Date(),
      },
    });
    await this.prisma.auditoriaAcesso
      .create({ data: { usuarioId: usuario.id, acao: 'agentes_despareado', recurso: 'agentes/conexao', ip } })
      .catch(() => undefined);
  }

  /* ---------------------------- conversas ---------------------------- */

  listarConversas() {
    return this.prisma.agentesConversa.findMany({
      orderBy: { atualizadoEm: 'desc' },
      take: 100,
    });
  }

  async mensagens(conversaId: string) {
    const conversa = await this.prisma.agentesConversa.findUnique({ where: { id: conversaId } });
    if (!conversa) throw new NotFoundException({ codigo: 'CONVERSA_DESCONHECIDA', message: 'Conversa não encontrada' });
    const mensagens = await this.prisma.agentesMensagem.findMany({
      where: { conversaId },
      orderBy: { criadoEm: 'asc' },
      take: 300,
    });
    await this.prisma.agentesMensagem.updateMany({ where: { conversaId, lida: false }, data: { lida: true } });
    return { conversa, mensagens };
  }

  async criarConversa(usuario: UsuarioLogado, mensagem: string, agenteId?: string) {
    const conexao = await this.conexaoPareada();
    const agenteEfetivo = agenteId ?? conexao.agentePadraoId;
    if (!agenteEfetivo) {
      throw new BadRequestException({ codigo: 'SEM_AGENTE', message: 'Nenhum agente padrão configurado' });
    }
    const refExterna = randomUUID();
    const { issue } = await chamarAplopes<{ issue: { id: string; conversation_id?: string | null } }>({
      metodo: 'POST',
      caminho: `/issues?workspace_id=${encodeURIComponent(conexao.workspaceId)}`,
      token: conexao.token,
      baseUrl: conexao.baseUrl,
      cabecalhos: { 'Idempotency-Key': refExterna },
      corpo: {
        title: mensagem.slice(0, 140),
        description: `${usuario.nome}: ${mensagem}`,
        external_ref: refExterna,
        agent_id: agenteEfetivo,
      },
    });

    // Upsert por refExterna: o webhook pode ter chegado ANTES (corrida) —
    // o Aplopes ecoa a Idempotency-Key nos eventos.
    const conversa = await this.prisma.agentesConversa.upsert({
      where: { refExterna },
      create: {
        refExterna,
        issueRemotaId: issue.id,
        conversaRemotaId: issue.conversation_id ?? null,
        titulo: mensagem.slice(0, 140),
        solicitanteId: usuario.id,
        solicitanteNome: usuario.nome,
        agenteId: agenteEfetivo,
        mensagens: { create: { autor: 'usuario', conteudo: mensagem } },
      },
      update: {
        issueRemotaId: issue.id,
        conversaRemotaId: issue.conversation_id ?? null,
        solicitanteId: usuario.id,
        solicitanteNome: usuario.nome,
        mensagens: { create: { autor: 'usuario', conteudo: mensagem } },
        atualizadoEm: new Date(),
      },
    });
    return conversa;
  }

  async enviarMensagem(conversaId: string, conteudo: string) {
    const conexao = await this.conexaoPareada();
    const conversa = await this.prisma.agentesConversa.findUnique({ where: { id: conversaId } });
    if (!conversa) throw new NotFoundException({ codigo: 'CONVERSA_DESCONHECIDA', message: 'Conversa não encontrada' });
    if (!conversa.conversaRemotaId) {
      throw new BadRequestException({ codigo: 'SEM_THREAD', message: 'A conversa remota ainda não foi criada — aguarde a sincronização' });
    }
    await chamarAplopes({
      metodo: 'POST',
      caminho: `/conversations/${encodeURIComponent(conversa.conversaRemotaId)}/messages?workspace_id=${encodeURIComponent(conexao.workspaceId)}`,
      token: conexao.token,
      baseUrl: conexao.baseUrl,
      corpo: { content: conteudo },
    });
    const mensagem = await this.prisma.agentesMensagem.create({
      data: { conversaId, autor: 'usuario', conteudo },
    });
    await this.prisma.agentesConversa.update({
      where: { id: conversaId },
      data: { atualizadoEm: new Date(), temPendente: true },
    });
    return mensagem;
  }

  /* ----------------------------- webhook ----------------------------- */

  async processarWebhook(
    assinatura: string | undefined,
    timestamp: string | undefined,
    rawBody: string,
  ): Promise<{ ok: boolean }> {
    const conexao = await this.conexao();
    if (!conexao?.webhookSecretCifrado) {
      throw new UnauthorizedException({ codigo: 'WEBHOOK_NAO_CONFIGURADO', message: 'Webhook sem segredo' });
    }
    if (!assinatura || !timestamp) {
      throw new UnauthorizedException({ codigo: 'ASSINATURA_AUSENTE', message: 'Assinatura ausente' });
    }
    const idade = Math.abs(Date.now() - Number(timestamp));
    if (!Number.isFinite(idade) || idade > JANELA_WEBHOOK_MS) {
      throw new UnauthorizedException({ codigo: 'FORA_DA_JANELA', message: 'Timestamp fora da janela' });
    }
    const segredo = decifrar(this.config, conexao.webhookSecretCifrado);
    const esperada = `sha256=${createHmac('sha256', segredo).update(`${timestamp}.${rawBody}`).digest('hex')}`;
    const a = Buffer.from(assinatura);
    const b = Buffer.from(esperada);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException({ codigo: 'ASSINATURA_INVALIDA', message: 'Assinatura inválida' });
    }

    const evento = JSON.parse(rawBody) as {
      id?: string;
      type?: string;
      data?: Record<string, unknown>;
    };
    const eventoId = evento.id ?? sha256hex(rawBody);

    // Outbox: evento repetido responde ok sem reprocessar.
    const registrado = await this.prisma.agentesEvento
      .create({ data: { eventoRemotoId: eventoId, tipo: evento.type ?? 'desconhecido' } })
      .catch(() => null);
    if (!registrado) return { ok: true };

    await this.aplicarEvento(evento).catch((e: unknown) =>
      this.logger.warn(`Evento de webhook não aplicado (${evento.type}): ${String(e)}`),
    );
    return { ok: true };
  }

  private async aplicarEvento(evento: { type?: string; data?: Record<string, unknown> }): Promise<void> {
    const dado = evento.data ?? {};
    const refExterna = (dado.external_ref ?? dado.externalRef) as string | undefined;
    const issueId = (dado.issue_id ?? dado.issueId ?? (dado.issue as { id?: string } | undefined)?.id) as string | undefined;

    const conversa = refExterna
      ? await this.prisma.agentesConversa.findUnique({ where: { refExterna } })
      : issueId
        ? await this.prisma.agentesConversa.findFirst({ where: { issueRemotaId: issueId } })
        : null;
    if (!conversa) return;

    if (evento.type === 'message.created') {
      const conteudo = String(dado.content ?? dado.message ?? '');
      if (!conteudo) return;
      const remotoId = (dado.message_id ?? dado.id) as string | undefined;
      await this.prisma.agentesMensagem
        .create({
          data: {
            conversaId: conversa.id,
            autor: String(dado.author_type ?? '').toUpperCase() === 'USER' ? 'usuario' : 'agente',
            conteudo,
            agenteId: (dado.agent_id as string | undefined) ?? null,
            agenteNome: (dado.agent_name as string | undefined) ?? null,
            remotoId: remotoId ?? null,
          },
        })
        .catch(() => undefined); // unique (conversa, remoto_id) = já espelhada
      await this.prisma.agentesConversa.update({
        where: { id: conversa.id },
        data: { atualizadoEm: new Date(), temPendente: false },
      });
      return;
    }

    const status = (dado.status ?? dado.task_status) as string | undefined;
    if (status) {
      await this.prisma.agentesConversa.update({
        where: { id: conversa.id },
        data: { status: status.toUpperCase(), atualizadoEm: new Date() },
      });
    }
  }

  /* -------------------------- reconciliação -------------------------- */

  /** Poll de 60s: fecha o loop mesmo sem webhook registrado do outro lado. */
  @Cron('*/60 * * * * *')
  async reconciliar(): Promise<void> {
    const conexaoBruta = await this.conexao();
    if (!conexaoBruta || conexaoBruta.status !== 'pareado') return;
    let conexao;
    try {
      conexao = await this.conexaoPareada();
    } catch {
      return;
    }

    const abertas = await this.prisma.agentesConversa.findMany({
      where: { status: { notIn: [...ESTADOS_FINAIS] }, conversaRemotaId: { not: null } },
      orderBy: { atualizadoEm: 'desc' },
      take: 10,
    });

    for (const conversa of abertas) {
      try {
        const resposta = await chamarAplopes<unknown>({
          metodo: 'GET',
          caminho: `/conversations/${encodeURIComponent(conversa.conversaRemotaId!)}/messages?workspace_id=${encodeURIComponent(conexao.workspaceId)}`,
          token: conexao.token,
          baseUrl: conexao.baseUrl,
        });
        const lista = Array.isArray(resposta)
          ? resposta
          : ((resposta as { messages?: unknown[] }).messages ?? (resposta as { data?: unknown[] }).data ?? []);
        for (const bruto of lista as Record<string, unknown>[]) {
          const remotoId = String(bruto.id ?? '');
          const conteudo = String(bruto.content ?? '');
          if (!remotoId || !conteudo) continue;
          const autorBruto = String(bruto.author_type ?? bruto.role ?? '').toUpperCase();
          await this.prisma.agentesMensagem
            .create({
              data: {
                conversaId: conversa.id,
                autor: autorBruto === 'USER' ? 'usuario' : 'agente',
                conteudo,
                agenteId: (bruto.agent_id as string | undefined) ?? null,
                agenteNome: (bruto.agent_name as string | undefined) ?? null,
                remotoId,
              },
            })
            .then(() =>
              this.prisma.agentesConversa.update({
                where: { id: conversa.id },
                data: { atualizadoEm: new Date(), temPendente: false },
              }),
            )
            .catch(() => undefined); // já espelhada
        }
        // Status da issue (BACKLOG → EM_PROGRESSO → CONCLUIDA…).
        if (conversa.issueRemotaId) {
          const detalhe = await chamarAplopes<{ issue?: { status?: string } }>({
            metodo: 'GET',
            caminho: `/issues/${encodeURIComponent(conversa.issueRemotaId)}?workspace_id=${encodeURIComponent(conexao.workspaceId)}`,
            token: conexao.token,
            baseUrl: conexao.baseUrl,
          }).catch(() => null);
          const status = detalhe?.issue?.status;
          if (status && status.toUpperCase() !== conversa.status) {
            await this.prisma.agentesConversa.update({
              where: { id: conversa.id },
              data: { status: status.toUpperCase() },
            });
          }
        }
        await this.prisma.agentesConversa.update({
          where: { id: conversa.id },
          data: { sincronizadoEm: new Date() },
        });
      } catch (erro) {
        this.logger.warn(`Reconciliação da conversa ${conversa.id}: ${String(erro)}`);
      }
    }
    await this.prisma.agentesConexao.update({
      where: { id: 1 },
      data: { sincronizadoEm: new Date() },
    });
  }
}
