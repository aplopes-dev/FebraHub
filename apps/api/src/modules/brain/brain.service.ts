import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import type { UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { podeVer } from '../../common/guards/setor.guard';
import { cifrar, decifrar } from '../agentes/agentes.service';
import { permissoesEfetivas } from '../permissoes/efetivas';
import { BrainAgenteService } from './brain-agente.service';
import { GbrainCliente } from './gbrain.cliente';

/**
 * A fonte que todo mundo lê. Existe para o que não é de setor nenhum —
 * política interna, calendário, manual de marca.
 */
export const FONTE_GERAL = 'geral';

/** Uma fonte por hub. Espelha GBRAIN_FONTES no compose e as pastas que o
 *  entrypoint do container cria. */
export const FONTES_SETOR = [
  'comercial',
  'financeiro',
  'marketing',
  'pedagogico',
  'eventos',
  'loja',
  'estoque',
  'crm',
] as const;

const TODAS_FONTES = [FONTE_GERAL, ...FONTES_SETOR];

export interface ResultadoBusca {
  slug: string;
  titulo: string;
  trecho: string;
  fonte: string;
  score: number | null;
}

/**
 * Memória institucional.
 *
 * A decisão que governa este arquivo: o recorte de acesso NÃO é um filtro
 * aplicado na resposta. Cada pessoa tem um cliente OAuth próprio no gbrain,
 * cujo `federated_read` lista exatamente as fontes dos setores que ela
 * alcança — e o gbrain filtra no SQL, antes de a busca acontecer.
 *
 * Filtrar depois funcionaria para a busca (dá para descartar linha por
 * fonte), mas não para a resposta sintetizada: ali o modelo já leu tudo e o
 * texto que volta pode carregar o que veio de um setor alheio. Provisionar
 * credencial por pessoa é o que fecha esse caminho.
 */
@Injectable()
export class BrainService {
  private readonly logger = new Logger(BrainService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gbrain: GbrainCliente,
    private readonly config: ConfigService,
    @Inject(forwardRef(() => BrainAgenteService))
    private readonly agente: BrainAgenteService,
  ) {}

  /**
   * As fontes que a pessoa LÊ: a geral mais as dos setores que ela alcança.
   * `podeVer` é o mesmo dos hubs — os dois eixos (setor do cadastro e
   * permissão `setor.<hub>.ver` do perfil) já estão somados lá, então a
   * memória herda o recorte dos dados sem uma segunda regra para manter.
   */
  fontesDe(usuario: UsuarioLogado): string[] {
    const minhas = FONTES_SETOR.filter((f) => podeVer(usuario, [f]));
    return [FONTE_GERAL, ...minhas];
  }

  /** A fonte onde ela ESCREVE: o setor primário, ou a geral para a diretoria. */
  fonteDeEscritaDe(usuario: UsuarioLogado): string {
    const setor = usuario.setor;
    return (FONTES_SETOR as readonly string[]).includes(setor) ? setor : FONTE_GERAL;
  }

  async estado() {
    const ok = await this.gbrain.saudavel();
    if (!ok) return { disponivel: false, fontes: [] as { id: string; paginas: number | null }[] };

    // O /admin/api/sources do gbrain não traz `pages`. Contamos via list_pages
    // com a credencial de serviço (lê todas as fontes).
    const contagens = new Map<string, number>();
    try {
      const credencial = await this.credencialDeServico(FONTE_GERAL);
      let offset = 0;
      for (let pagina = 0; pagina < 30; pagina++) {
        const bruto = await this.gbrain.operacao<ConteudoMcp>(credencial, 'list_pages', {
          limit: 100,
          offset,
          sort: 'updated_asc',
        });
        const linhas = comoLista(corpoDaOperacao(bruto));
        if (!linhas.length) break;
        for (const l of linhas) {
          const fonte =
            typeof l.source_id === 'string' && l.source_id
              ? String(l.source_id)
              : fonteDoSlug(String(l.slug ?? ''));
          if (!(TODAS_FONTES as readonly string[]).includes(fonte)) continue;
          contagens.set(fonte, (contagens.get(fonte) ?? 0) + 1);
        }
        if (linhas.length < 100) break;
        offset += 100;
      }
    } catch (e) {
      this.logger.warn(`brain: contagem de páginas falhou — ${(e as Error).message}`);
    }

    return {
      disponivel: true,
      fontes: TODAS_FONTES.map((id) => ({
        id,
        paginas: contagens.has(id) ? (contagens.get(id) as number) : contagens.size ? 0 : null,
      })),
    };
  }

  async buscar(usuario: UsuarioLogado, consulta: string, limite = 12): Promise<ResultadoBusca[]> {
    const credencial = await this.credencialDe(usuario);
    // `search` devolve um ARRAY de SearchResult direto — não um envelope
    // `{results}`. E o SearchResult não carrega a fonte: ela sai do prefixo do
    // slug, que é como escrevemos toda página (`<fonte>/<nome>`).
    // `search` é o caminho estável no MCP; se vier vazio, tenta `query` (híbrido).
    const brutoSearch = await this.gbrain.operacao<ConteudoMcp>(credencial, 'search', {
      query: consulta,
      limit: Math.min(50, Math.max(1, limite)),
    });
    let linhas = comoLista(corpoDaOperacao(brutoSearch));
    if (!linhas.length) {
      try {
        const brutoQuery = await this.gbrain.operacao<ConteudoMcp>(credencial, 'query', {
          question: consulta,
          limit: Math.min(50, Math.max(1, limite)),
        });
        linhas = comoLista(corpoDaOperacao(brutoQuery));
      } catch {
        /* search já era o melhor esforço */
      }
    }
    return linhas.map((l) => {
      const slug = String(l.slug ?? '');
      return {
        slug,
        titulo: String(l.title ?? l.titulo ?? slug ?? 'Sem título'),
        trecho: String(l.chunk_text ?? l.snippet ?? l.excerpt ?? l.content ?? '').slice(0, 1800),
        fonte: fonteDoSlug(slug),
        score: typeof l.score === 'number' ? l.score : null,
      };
    });
  }

  /** Lê a página inteira (markdown) — o agente usa quando o trecho da busca é curto. */
  async lerPagina(usuario: UsuarioLogado, slug: string): Promise<ResultadoBusca | null> {
    const credencial = await this.credencialDe(usuario);
    for (const ferramenta of ['get_page', 'get'] as const) {
      try {
        const bruto = await this.gbrain.operacao<ConteudoMcp>(credencial, ferramenta, { slug });
        const corpo = corpoDaOperacao(bruto) as Record<string, unknown>;
        // `get` não existe no MCP; `get_page` devolve compiled_truth (não content).
        if ((corpo as { error?: string }).error) continue;
        const titulo = String(corpo.title ?? corpo.titulo ?? slug);
        const conteudo = String(
          corpo.compiled_truth ??
            corpo.content ??
            corpo.body ??
            corpo.markdown ??
            corpo.timeline ??
            '',
        );
        if (!conteudo.trim()) continue;
        return {
          slug,
          titulo,
          // Modal de registro e o agente precisam do corpo quase inteiro.
          trecho: conteudo.slice(0, 40_000),
          fonte: fonteDoSlug(slug),
          score: null,
        };
      } catch {
        /* tenta o próximo nome de ferramenta */
      }
    }
    return null;
  }

  /**
   * Resposta via agente: várias consultas à memória, leitura de página se
   * preciso, e redação natural sem achismo (ver BrainAgenteService).
   */
  async perguntar(usuario: UsuarioLogado, pergunta: string) {
    return this.agente.responder(usuario, pergunta);
  }

  /**
   * Grava uma página na fonte do próprio setor.
   *
   * A fonte NÃO vai no corpo: `put_page` do gbrain ignora qualquer `source_id`
   * recebido e grava na fonte do grant do cliente. Como a credencial da pessoa
   * tem `sourceId` = setor dela, o destino já é o certo — e ninguém consegue
   * escrever em setor alheio nem forjando o parâmetro.
   */
  async registrar(usuario: UsuarioLogado, titulo: string, conteudo: string, origem?: string) {
    const credencial = await this.credencialDe(usuario);
    const fonte = this.fonteDeEscritaDe(usuario);
    const slug = `${fonte}/${apelido(titulo)}`;
    const assinatura = origem
      ? `Extraído de **${origem}** e registrado por ${usuario.nome} pelo FebraHub.`
      : `Registrado por ${usuario.nome} pelo FebraHub.`;
    await this.gbrain.operacao(credencial, 'put_page', {
      slug,
      title: titulo,
      // Assinado no corpo: daqui a um ano ninguém lembra quem escreveu, e o
      // gbrain guarda markdown, não metadado nosso.
      content: `# ${titulo}\n\n${conteudo}\n\n---\n${assinatura}\n`,
    });
    return { slug, fonte };
  }

  /**
   * Credencial de MÁQUINA da fonte, criada na primeira publicação.
   *
   * Uma por fonte porque um cliente do gbrain escreve em uma fonte só. Lê
   * todas: a sincronização precisa reescrever a própria página do mês
   * anterior, e ler o que já publicou é inofensivo — quem nunca alcança essas
   * páginas é a PESSOA, pela credencial dela.
   */
  async credencialDeServico(fonte: string = FONTE_GERAL): Promise<{ clientId: string; segredo: string }> {
    const existente = await this.prisma.brainClienteServico.findUnique({ where: { fonte } });
    if (existente) {
      return { clientId: existente.clientId, segredo: decifrar(this.config, existente.segredo) };
    }
    const { clientId, clientSecret } = await this.gbrain.registrarCliente(`febrahub:sistema:${fonte}`);
    await this.gbrain.reescoparCliente(clientId, fonte, [FONTE_GERAL, ...FONTES_SETOR]);
    await this.prisma.brainClienteServico.create({
      data: { fonte, clientId, segredo: cifrar(this.config, clientSecret) },
    });
    this.logger.log(`brain: credencial de serviço criada para a fonte ${fonte}`);
    return { clientId, segredo: clientSecret };
  }

  /**
   * A credencial da pessoa, criada na primeira consulta e reescopada quando o
   * acesso dela muda. Não há tela de provisionamento: mudar o perfil de
   * alguém na tela de Usuários já basta, e o ajuste acontece no próximo uso.
   */
  private async credencialDe(usuario: UsuarioLogado): Promise<{ clientId: string; segredo: string }> {
    const fontes = this.fontesDe(usuario);
    const escrita = this.fonteDeEscritaDe(usuario);
    const existente = await this.prisma.brainCliente.findUnique({ where: { usuarioId: usuario.id } });

    if (existente) {
      const mudou =
        existente.fonteEscrita !== escrita || !mesmoConjunto(existente.fontes, fontes);
      if (mudou) {
        await this.gbrain.reescoparCliente(existente.clientId, escrita, fontes);
        await this.prisma.brainCliente.update({
          where: { usuarioId: usuario.id },
          data: { fonteEscrita: escrita, fontes },
        });
        this.logger.log(`brain: acesso de ${usuario.email} reescopado para [${fontes.join(', ')}]`);
      }
      return { clientId: existente.clientId, segredo: decifrar(this.config, existente.segredo) };
    }

    const { clientId, clientSecret } = await this.gbrain.registrarCliente(`febrahub:${usuario.email}`);
    await this.gbrain.reescoparCliente(clientId, escrita, fontes);
    await this.prisma.brainCliente.create({
      data: {
        usuarioId: usuario.id,
        clientId,
        segredo: cifrar(this.config, clientSecret),
        fonteEscrita: escrita,
        fontes,
      },
    });
    this.logger.log(`brain: credencial criada para ${usuario.email} em [${fontes.join(', ')}]`);
    return { clientId, segredo: clientSecret };
  }

  /**
   * Revalida TODAS as credenciais contra o acesso atual de cada pessoa.
   * Existe porque o reescopo preguiçoso só acontece quando alguém consulta —
   * quem perdeu acesso e não abre a tela ficaria com a credencial antiga
   * válida no gbrain até a próxima consulta que nunca vem.
   */
  async revalidarAcessos() {
    const clientes = await this.prisma.brainCliente.findMany({
      include: { usuario: { include: { setores: true, perfilAcesso: true } } },
    });
    let ajustados = 0;
    for (const c of clientes) {
      const u = c.usuario;
      if (!u.ativo) {
        await this.gbrain.revogarCliente(c.clientId);
        await this.prisma.brainCliente.delete({ where: { usuarioId: c.usuarioId } });
        ajustados += 1;
        continue;
      }
      const logado = perfilParaLogado(u);
      const fontes = this.fontesDe(logado);
      const escrita = this.fonteDeEscritaDe(logado);
      if (c.fonteEscrita === escrita && mesmoConjunto(c.fontes, fontes)) continue;
      await this.gbrain.reescoparCliente(c.clientId, escrita, fontes);
      await this.prisma.brainCliente.update({
        where: { usuarioId: c.usuarioId },
        data: { fonteEscrita: escrita, fontes },
      });
      ajustados += 1;
    }
    return { conferidos: clientes.length, ajustados };
  }
}

/* --------------------------------- auxiliares -------------------------------- */

type ConteudoMcp = { content?: { type: string; text?: string }[] } | Record<string, unknown> | null;

/**
 * O MCP embrulha o retorno em `content: [{type:'text', text:'<json>'}]`.
 * Desembrulha quando vier assim e devolve o objeto cru quando não vier.
 */
function corpoDaOperacao(bruto: ConteudoMcp): unknown {
  const conteudo = (bruto as { content?: { type: string; text?: string }[] })?.content;
  if (Array.isArray(conteudo)) {
    const texto = conteudo.find((c) => c.type === 'text')?.text;
    if (texto) {
      try {
        return JSON.parse(texto);
      } catch {
        return { answer: texto };
      }
    }
  }
  return bruto;
}

/** O gbrain devolve array cru nas buscas; alguns caminhos embrulham em
 *  `{results}`. Aceita os dois e nunca estoura. */
function comoLista(dados: unknown): Record<string, unknown>[] {
  if (Array.isArray(dados)) return dados as Record<string, unknown>[];
  const envelope = (dados as { results?: unknown })?.results;
  return Array.isArray(envelope) ? (envelope as Record<string, unknown>[]) : [];
}

/** A fonte sai do prefixo do slug (`comercial/politica-de-desconto`), porque o
 *  SearchResult do gbrain não traz `source_id`. Toda página que escrevemos
 *  nasce com esse prefixo. */
function fonteDoSlug(slug: string): string {
  const prefixo = slug.split('/')[0];
  return prefixo && [FONTE_GERAL, ...FONTES_SETOR].includes(prefixo as never) ? prefixo : FONTE_GERAL;
}

const mesmoConjunto = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && [...a].sort().every((x, i) => x === [...b].sort()[i]);

/** Slug estável a partir do título: minúsculo, sem acento, sem pontuação. */
function apelido(titulo: string): string {
  return (
    titulo
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'pagina'
  );
}

/** O mínimo de UsuarioLogado que podeVer/fontesDe consomem. */
function perfilParaLogado(u: {
  id: string;
  email: string;
  nome: string;
  papel: string;
  setor: string;
  setores: { setor: string }[];
  perfilAcesso: { permissoes: string[] } | null;
}): UsuarioLogado {
  const setores = [...new Set([u.setor, ...u.setores.map((s) => s.setor)])].filter(Boolean);
  return {
    id: u.id,
    email: u.email,
    nome: u.nome,
    papel: u.papel as UsuarioLogado['papel'],
    setor: u.setor,
    setores,
    // permissoesEfetivas e não a lista crua do perfil: é ela que dá o
    // catálogo inteiro a admin e a quem tem o setor 'geral'.
    permissoes: permissoesEfetivas({ papel: u.papel, setor: u.setor, setores, perfilAcesso: u.perfilAcesso }),
    perfilAcesso: null,
  };
}
