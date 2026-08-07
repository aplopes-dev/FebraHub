import { Injectable, Logger } from '@nestjs/common';
import { SocialConfigService } from './social-config.service';
import type {
  AnalisePostagem,
  Campanha,
  Conversa,
  ContaSocial,
  Mensagem,
  MetricasCampanha,
  PaginaPostagens,
  PainelCampanhas,
  PontoSerie,
  Postagem,
  VisaoGeral,
} from './social.tipos';
import { ZernioCliente } from './zernio.cliente';

/* ── formas cruas do Zernio ────────────────────────────────────────────────
   Só o que consumimos. Tudo opcional de propósito: o Zernio omite campos
   conforme o plano (analytics é add-on) e conforme a rede, e um campo que
   some não pode derrubar a tela. */

interface ContaCrua {
  _id: string;
  platform: string;
  username?: string;
  displayName?: string;
  profilePicture?: string | null;
  profileUrl?: string;
  isActive?: boolean;
  needsReconnection?: boolean;
  followersCount?: number;
  enabled?: boolean;
}

interface PostagemCrua {
  _id: string;
  title?: string;
  content?: string;
  status?: string;
  scheduledFor?: string;
  createdAt?: string;
  mediaItems?: { type?: string; url?: string; thumbnail?: string }[];
  platforms?: {
    platform?: string;
    accountId?: string | { _id?: string };
    status?: string;
    platformPostUrl?: string;
    publishedAt?: string;
    errorMessage?: string;
  }[];
}

interface AnaliseCrua {
  postId?: string;
  status?: string;
  content?: string;
  publishedAt?: string | null;
  platform?: string;
  platformPostUrl?: string | null;
  thumbnailUrl?: string | null;
  syncStatus?: string;
  analytics?: Record<string, number | undefined>;
}

interface ConversaCrua {
  id: string;
  platform?: string;
  accountId?: string;
  accountUsername?: string;
  participantName?: string;
  participantPicture?: string | null;
  lastMessage?: string;
  updatedTime?: string;
  unreadCount?: number | null;
  url?: string | null;
}

interface MensagemCrua {
  id: string;
  message?: string;
  senderName?: string;
  direction?: string;
  createdAt?: string;
  attachments?: { type?: string; url?: string }[];
}

interface CampanhaCrua {
  platformCampaignId?: string;
  platform?: string;
  campaignName?: string;
  status?: string;
  currency?: string;
  budget?: { amount?: number; daily?: number; lifetime?: number } | number;
  campaignBudget?: number;
  budgetLevel?: string;
  adCount?: number;
  platformAdAccountId?: string;
  platformAdAccountName?: string;
  platformObjective?: string;
  metrics?: Record<string, number | undefined>;
}

/** As redes onde o Zernio tem caixa de entrada. Pedir DM de YouTube devolve
 *  erro do fornecedor — melhor nem oferecer na tela. */
export const REDES_COM_INBOX = [
  'facebook',
  'instagram',
  'twitter',
  'bluesky',
  'reddit',
  'telegram',
  'whatsapp',
] as const;

/** Sufixos das contas de ANÚNCIO. Elas vêm misturadas em /v1/accounts, e uma
 *  conta de anúncio no seletor de publicação só geraria erro na hora de
 *  publicar. */
const SUFIXO_ANUNCIO = 'ads';

const numero = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const texto = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v : null);

/** Métrica que pode legitimamente não existir — devolve `null`, nunca zero.
 *  Zero e "não medido" são coisas diferentes para quem lê um relatório. */
const medida = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

const hoje = (): string => new Date().toISOString().slice(0, 10);
const diasAtras = (n: number): string =>
  new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);

@Injectable()
export class SocialService {
  private readonly logger = new Logger(SocialService.name);

  constructor(
    private readonly zernio: ZernioCliente,
    private readonly config: SocialConfigService,
  ) {}

  // ── Contas e visão geral ────────────────────────────────────────────────

  async contas(): Promise<{ contas: ContaSocial[]; temAnalytics: boolean }> {
    const { perfilZernio } = await this.config.preferencias();
    const bruto = await this.zernio.getCacheado<{
      accounts?: ContaCrua[];
      hasAnalyticsAccess?: boolean;
    }>('/v1/accounts', { profileId: perfilZernio ?? undefined });

    return {
      contas: (bruto.accounts ?? []).map((c) => this.traduzirConta(c)),
      temAnalytics: !!bruto.hasAnalyticsAccess,
    };
  }

  /**
   * O cabeçalho do painel. Junta quatro leituras porque, separadas, a tela
   * faria quatro idas e a primeira aba ficaria montando aos pedaços.
   *
   * Cada pedaço falha sozinho: se a caixa de entrada estiver fora do ar, o
   * número de conversas vem `0` e o resto da tela continua de pé.
   */
  async visaoGeral(): Promise<VisaoGeral> {
    const { contas, temAnalytics } = await this.contas();
    const dePublicacao = contas.filter((c) => !c.deAnuncio);

    const [serie, publicadas, agendadas, conversas] = await Promise.all([
      this.serieDeAudiencia().catch(() => [] as PontoSerie[]),
      this.contarPostagens({ status: 'published', dateFrom: diasAtras(30) }).catch(() => 0),
      this.contarPostagens({ status: 'scheduled' }).catch(() => 0),
      this.contarConversas().catch(() => 0),
    ]);

    const comSeguidores = dePublicacao.filter((c) => c.seguidores !== null);
    return {
      contas: dePublicacao,
      totalSeguidores: comSeguidores.length
        ? comSeguidores.reduce((soma, c) => soma + (c.seguidores ?? 0), 0)
        : null,
      temAnalytics,
      serie,
      publicadas30d: publicadas,
      agendadas,
      conversasAbertas: conversas,
    };
  }

  /** Audiência somada por dia. O Zernio devolve uma série POR CONTA; aqui elas
   *  viram uma só, com carry-forward implícito (só somamos o que existe no
   *  dia, então um dia sem captura de uma conta não derruba o total). */
  private async serieDeAudiencia(): Promise<PontoSerie[]> {
    const { perfilZernio } = await this.config.preferencias();
    const bruto = await this.zernio.getCacheado<{
      stats?: Record<string, { date?: string; followers?: number }[]>;
    }>('/v1/accounts/follower-stats', {
      profileId: perfilZernio ?? undefined,
      fromDate: diasAtras(90),
      toDate: hoje(),
      granularity: 'daily',
    });

    const porDia = new Map<string, number>();
    for (const pontos of Object.values(bruto.stats ?? {})) {
      for (const p of pontos ?? []) {
        if (!p.date || typeof p.followers !== 'number') continue;
        porDia.set(p.date, (porDia.get(p.date) ?? 0) + p.followers);
      }
    }
    return [...porDia.entries()]
      .map(([data, valor]) => ({ data, valor }))
      .sort((a, b) => a.data.localeCompare(b.data));
  }

  private async contarPostagens(filtro: Record<string, string>): Promise<number> {
    const bruto = await this.zernio.getCacheado<{ pagination?: { total?: number } }>('/v1/posts', {
      ...filtro,
      limit: 1,
      page: 1,
    });
    return numero(bruto.pagination?.total);
  }

  private async contarConversas(): Promise<number> {
    const bruto = await this.zernio.getCacheado<{ data?: unknown[] }>('/v1/inbox/conversations', {
      status: 'active',
      limit: 50,
    });
    return (bruto.data ?? []).length;
  }

  // ── Postagens ───────────────────────────────────────────────────────────

  async postagens(filtros: {
    status?: string;
    rede?: string;
    pagina?: number;
    limite?: number;
    busca?: string;
  }): Promise<PaginaPostagens> {
    const { perfilZernio } = await this.config.preferencias();
    const bruto = await this.zernio.getCacheado<{
      posts?: PostagemCrua[];
      pagination?: { page?: number; total?: number; pages?: number };
    }>('/v1/posts', {
      profileId: perfilZernio ?? undefined,
      status: filtros.status,
      platform: filtros.rede,
      search: filtros.busca,
      page: filtros.pagina ?? 1,
      limit: filtros.limite ?? 20,
      sortBy: 'created-desc',
    });

    return {
      postagens: (bruto.posts ?? []).map((p) => this.traduzirPostagem(p)),
      total: numero(bruto.pagination?.total),
      pagina: bruto.pagination?.page ?? filtros.pagina ?? 1,
      paginas: numero(bruto.pagination?.pages),
    };
  }

  /**
   * Publicar ou agendar. Uma decisão importante mora aqui: quando não vem
   * `agendadaPara`, mandamos `publishNow`. Sem um dos dois o Zernio cria um
   * rascunho silencioso — e a pessoa acharia que publicou.
   */
  async publicar(dados: {
    conteudo: string;
    titulo?: string;
    destinos: { rede: string; contaId: string }[];
    agendadaPara?: string;
    rascunho?: boolean;
    midia?: { tipo: string; url: string }[];
  }): Promise<Postagem> {
    const { fuso } = await this.config.preferencias();
    const corpo: Record<string, unknown> = {
      content: dados.conteudo,
      ...(dados.titulo ? { title: dados.titulo } : {}),
      platforms: dados.destinos.map((d) => ({ platform: d.rede, accountId: d.contaId })),
      ...(dados.midia?.length
        ? { mediaItems: dados.midia.map((m) => ({ type: m.tipo, url: m.url })) }
        : {}),
      timezone: fuso,
    };
    if (dados.rascunho) corpo.isDraft = true;
    else if (dados.agendadaPara) corpo.scheduledFor = dados.agendadaPara;
    else corpo.publishNow = true;

    const bruto = await this.zernio.post<{ post?: PostagemCrua }>('/v1/posts', corpo);
    this.zernio.esquecer('/v1/posts');
    return this.traduzirPostagem(bruto.post ?? { _id: '' });
  }

  async apagarPostagem(id: string): Promise<{ ok: true }> {
    await this.zernio.delete(`/v1/posts/${encodeURIComponent(id)}`);
    this.zernio.esquecer('/v1/posts');
    return { ok: true };
  }

  /** Reenvia uma postagem que falhou. O erro costuma ser token vencido de uma
   *  rede só — as outras já publicaram e não são reenviadas pelo Zernio. */
  async reenviarPostagem(id: string): Promise<{ ok: true }> {
    await this.zernio.post(`/v1/posts/${encodeURIComponent(id)}/retry`);
    this.zernio.esquecer('/v1/posts');
    return { ok: true };
  }

  // ── Análise ─────────────────────────────────────────────────────────────

  async analise(filtros: {
    rede?: string;
    de?: string;
    ate?: string;
    limite?: number;
    ordenarPor?: string;
  }): Promise<AnalisePostagem[]> {
    const { perfilZernio } = await this.config.preferencias();
    const bruto = await this.zernio.getCacheado<AnaliseCrua[] | { data?: AnaliseCrua[] }>(
      '/v1/analytics',
      {
        profileId: perfilZernio ?? undefined,
        platform: filtros.rede,
        fromDate: filtros.de ?? diasAtras(30),
        toDate: filtros.ate ?? hoje(),
        limit: filtros.limite ?? 25,
        sortBy: filtros.ordenarPor ?? 'date',
        order: 'desc',
      },
    );

    // O endpoint devolve array quando é lista e objeto quando é um post só —
    // o mesmo tipo de armadilha que fez a busca do brain voltar vazia.
    const itens = Array.isArray(bruto) ? bruto : (bruto.data ?? []);
    return itens.map((a) => this.traduzirAnalise(a));
  }

  // ── Caixa de entrada ────────────────────────────────────────────────────

  async conversas(filtros: { rede?: string; limite?: number }): Promise<Conversa[]> {
    const { perfilZernio } = await this.config.preferencias();
    const bruto = await this.zernio.getCacheado<{ data?: ConversaCrua[] }>(
      '/v1/inbox/conversations',
      {
        profileId: perfilZernio ?? undefined,
        platform: filtros.rede,
        status: 'active',
        limit: filtros.limite ?? 30,
        sortOrder: 'desc',
      },
    );
    return (bruto.data ?? []).map((c) => this.traduzirConversa(c));
  }

  async mensagens(conversaId: string, contaId: string): Promise<Mensagem[]> {
    const bruto = await this.zernio.get<{ messages?: MensagemCrua[] }>(
      `/v1/inbox/conversations/${encodeURIComponent(conversaId)}/messages`,
      { accountId: contaId, limit: 50, sortOrder: 'asc' },
    );
    return (bruto.messages ?? []).map((m) => this.traduzirMensagem(m));
  }

  async responder(conversaId: string, contaId: string, mensagem: string): Promise<{ ok: true }> {
    await this.zernio.post(
      `/v1/inbox/conversations/${encodeURIComponent(conversaId)}/messages`,
      { accountId: contaId, message: mensagem },
    );
    this.zernio.esquecer('/v1/inbox');
    return { ok: true };
  }

  // ── Campanhas (Meta e demais) ───────────────────────────────────────────

  async campanhas(filtros: {
    rede?: string;
    contaAnuncio?: string;
    de?: string;
    ate?: string;
  }): Promise<PainelCampanhas> {
    const { perfilZernio, contaAnuncio } = await this.config.preferencias();
    const de = filtros.de ?? diasAtras(30);
    const ate = filtros.ate ?? hoje();
    const conta = filtros.contaAnuncio ?? contaAnuncio ?? undefined;

    const [lista, contas] = await Promise.all([
      this.zernio.getCacheado<{ campaigns?: CampanhaCrua[] }>('/v1/ads/campaigns', {
        profileId: perfilZernio ?? undefined,
        platform: filtros.rede,
        adAccountId: conta,
        fromDate: de,
        toDate: ate,
        limit: 100,
      }),
      this.zernio
        .getCacheado<{ accounts?: { id?: string; name?: string; currency?: string; status?: string }[] }>(
          '/v1/ads/accounts',
        )
        .catch(() => ({ accounts: [] as { id?: string; name?: string; currency?: string; status?: string }[] })),
    ]);

    const campanhas = (lista.campaigns ?? []).map((c) => this.traduzirCampanha(c));
    return {
      campanhas,
      total: this.somarMetricas(campanhas),
      // A moeda é a das campanhas retornadas. Misturar contas de moedas
      // diferentes num total só seria pior do que não mostrar total — por isso
      // só assume a moeda quando ela é única.
      moeda: this.moedaUnica(campanhas),
      contas: (contas.accounts ?? []).map((c) => ({
        id: c.id ?? '',
        nome: c.name ?? c.id ?? '',
        moeda: c.currency ?? null,
        status: c.status ?? null,
      })),
      de,
      ate,
    };
  }

  /** Pausar ou reativar. É a única escrita de campanha que a tela oferece:
   *  criar campanha exige criativo, público e orçamento — trabalho do painel
   *  do Meta, não de um resumo executivo. */
  async statusCampanha(id: string, rede: string, status: 'active' | 'paused') {
    const r = await this.zernio.put<{ updated?: number; message?: string }>(
      `/v1/ads/campaigns/${encodeURIComponent(id)}/status`,
      { status, platform: rede },
    );
    this.zernio.esquecer('/v1/ads');
    return { atualizadas: numero(r.updated), mensagem: r.message ?? null };
  }

  /** Um "ping" honesto: bate numa rota barata e diz se a chave funciona. */
  async testar(): Promise<{ ok: boolean; contas: number; mensagem: string }> {
    const { contas } = await this.contas();
    return {
      ok: true,
      contas: contas.length,
      mensagem: contas.length
        ? `Conectado. ${contas.length} conta(s) disponível(is).`
        : 'Conectado, mas nenhuma conta está vinculada no Zernio.',
    };
  }

  // ── Tradutores ──────────────────────────────────────────────────────────

  private traduzirConta(c: ContaCrua): ContaSocial {
    return {
      id: c._id,
      rede: c.platform,
      usuario: texto(c.username),
      nome: texto(c.displayName),
      foto: texto(c.profilePicture),
      url: texto(c.profileUrl),
      ativa: c.isActive !== false && c.enabled !== false,
      precisaReconectar: !!c.needsReconnection,
      seguidores: medida(c.followersCount),
      deAnuncio: c.platform.endsWith(SUFIXO_ANUNCIO),
    };
  }

  private traduzirPostagem(p: PostagemCrua): Postagem {
    return {
      id: p._id,
      titulo: texto(p.title),
      conteudo: p.content ?? '',
      status: p.status ?? 'rascunho',
      destinos: (p.platforms ?? []).map((d) => ({
        rede: d.platform ?? 'desconhecida',
        contaId: typeof d.accountId === 'string' ? d.accountId : (d.accountId?._id ?? null),
        status: texto(d.status),
        url: texto(d.platformPostUrl),
        publicadaEm: texto(d.publishedAt),
        erro: texto(d.errorMessage),
      })),
      agendadaPara: texto(p.scheduledFor),
      criadaEm: texto(p.createdAt),
      midia: (p.mediaItems ?? [])
        .filter((m) => m.url)
        .map((m) => ({ tipo: m.type ?? 'image', url: m.url as string, miniatura: texto(m.thumbnail) })),
    };
  }

  private traduzirAnalise(a: AnaliseCrua): AnalisePostagem {
    const m = a.analytics ?? {};
    return {
      postId: a.postId ?? '',
      rede: a.platform ?? 'desconhecida',
      status: a.status ?? 'published',
      conteudo: a.content ?? '',
      publicadaEm: texto(a.publishedAt),
      url: texto(a.platformPostUrl),
      miniatura: texto(a.thumbnailUrl),
      sincronia: a.syncStatus ?? 'unavailable',
      metricas: {
        impressoes: medida(m.impressions),
        alcance: medida(m.reach),
        curtidas: medida(m.likes),
        comentarios: medida(m.comments),
        compartilhamentos: medida(m.shares),
        salvos: medida(m.saves),
        cliques: medida(m.clicks),
        visualizacoes: medida(m.views),
        novosSeguidores: medida(m.follows),
        taxaEngajamento: medida(m.engagementRate),
      },
    };
  }

  private traduzirConversa(c: ConversaCrua): Conversa {
    return {
      id: c.id,
      rede: c.platform ?? 'desconhecida',
      contaId: c.accountId ?? '',
      contaUsuario: texto(c.accountUsername),
      participante: c.participantName ?? 'Sem nome',
      foto: texto(c.participantPicture),
      ultimaMensagem: c.lastMessage ?? '',
      atualizadaEm: texto(c.updatedTime),
      naoLidas: numero(c.unreadCount),
      url: texto(c.url),
    };
  }

  private traduzirMensagem(m: MensagemCrua): Mensagem {
    return {
      id: m.id,
      texto: m.message ?? '',
      // O Zernio usa 'in'/'out'; qualquer outra coisa tratamos como recebida —
      // errar para o lado de "precisa de resposta" é o erro barato.
      sentido: m.direction === 'out' || m.direction === 'outbound' ? 'saida' : 'entrada',
      autor: texto(m.senderName),
      criadaEm: texto(m.createdAt),
      anexos: (m.attachments ?? []).map((a) => ({ tipo: texto(a.type), url: texto(a.url) })),
    };
  }

  private traduzirCampanha(c: CampanhaCrua): Campanha {
    const m = c.metrics ?? {};
    const orcamento =
      typeof c.budget === 'number'
        ? c.budget
        : (c.budget?.daily ?? c.budget?.lifetime ?? c.budget?.amount ?? c.campaignBudget ?? null);
    return {
      id: c.platformCampaignId ?? '',
      rede: c.platform ?? 'desconhecida',
      nome: c.campaignName ?? 'Sem nome',
      status: c.status ?? 'unknown',
      moeda: texto(c.currency),
      orcamento: typeof orcamento === 'number' ? orcamento : null,
      nivelOrcamento: texto(c.budgetLevel),
      anuncios: numero(c.adCount),
      contaAnuncioId: texto(c.platformAdAccountId),
      contaAnuncioNome: texto(c.platformAdAccountName),
      objetivo: texto(c.platformObjective),
      metricas: {
        gasto: numero(m.spend),
        impressoes: numero(m.impressions),
        alcance: numero(m.reach),
        cliques: numero(m.clicks),
        ctr: numero(m.ctr),
        cpc: numero(m.cpc),
        cpm: numero(m.cpm),
        engajamento: numero(m.engagement),
        conversoes: numero(m.conversions),
        custoPorConversao: numero(m.costPerConversion),
        valorConvertido: numero(m.purchaseValue),
        roas: numero(m.roas),
      },
    };
  }

  /**
   * O total do período. Gasto, impressões e cliques SOMAM; CTR, CPC, CPM e
   * ROAS são RAZÕES — somá-las daria um número sem sentido (a média de duas
   * médias não é a média). Por isso são recalculadas a partir dos somatórios.
   */
  private somarMetricas(campanhas: Campanha[]): MetricasCampanha {
    const t = campanhas.reduce(
      (acc, c) => ({
        gasto: acc.gasto + c.metricas.gasto,
        impressoes: acc.impressoes + c.metricas.impressoes,
        alcance: acc.alcance + c.metricas.alcance,
        cliques: acc.cliques + c.metricas.cliques,
        engajamento: acc.engajamento + c.metricas.engajamento,
        conversoes: acc.conversoes + c.metricas.conversoes,
        valorConvertido: acc.valorConvertido + c.metricas.valorConvertido,
      }),
      { gasto: 0, impressoes: 0, alcance: 0, cliques: 0, engajamento: 0, conversoes: 0, valorConvertido: 0 },
    );
    return {
      ...t,
      ctr: t.impressoes ? (t.cliques / t.impressoes) * 100 : 0,
      cpc: t.cliques ? t.gasto / t.cliques : 0,
      cpm: t.impressoes ? (t.gasto / t.impressoes) * 1000 : 0,
      custoPorConversao: t.conversoes ? t.gasto / t.conversoes : 0,
      roas: t.gasto ? t.valorConvertido / t.gasto : 0,
    };
  }

  private moedaUnica(campanhas: Campanha[]): string | null {
    const moedas = new Set(campanhas.map((c) => c.moeda).filter((m): m is string => !!m));
    return moedas.size === 1 ? [...moedas][0] : null;
  }
}
