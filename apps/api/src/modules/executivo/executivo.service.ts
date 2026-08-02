/**
 * Orquestrador do Hub Executivo.
 *
 * O caminho de um card: SQL do catálogo → séries (mensal e diária) → motor de
 * cálculo puro (esperado, projeção, comparações, status, texto) → resposta.
 * TODO cálculo acontece aqui no backend (spec §23) — o front só formata.
 *
 * Cache: as consultas caras (séries) ficam 5 minutos em memória, POR
 * INDICADOR — não por usuário. A permissão filtra na hora de responder, então
 * o mesmo cache serve o admin e o gestor sem vazar nada: quem não pode ver o
 * setor simplesmente não recebe o card. "Atualizar dados" limpa tudo.
 *
 * "Hoje" vem do Postgres em America/Bahia — a mesma referência do resto do
 * sistema (o container roda em UTC; confiar no relógio do Node mudaria o dia
 * três horas antes da Bahia).
 */
import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { podeVer } from '../../common/guards/setor.guard';
import {
  calcularComparacoes,
  consolidadoAnual,
  diasNoMes,
  distribuicaoIntraMes,
  fracaoEsperada,
  mesDe,
  projetarAno,
  projetarMes,
  somaAteDia,
  somarMeses,
  statusCard,
  tendenciaDe,
  textoExecutivo,
  type DistribuicaoIntraMes,
  type PontoDiario,
  type PontoMensal,
} from './calculos';
import { fmtValor, gerarAlertas } from './alertas';
import {
  INDICADORES,
  NOME_SETOR,
  indicadorPorCodigo,
  type DefinicaoIndicador,
} from './indicadores';
import { MetasService, type MetasDoMes } from './metas.service';
import type {
  Alerta,
  AnualIndicador,
  BlocoSetor,
  CardIndicador,
  Destaque,
  DetalheIndicadorResposta,
  FonteResumo,
  PontoRitmo,
  PreferenciasHub,
  QualidadeDado,
  QuebraDimensao,
  ResumoExecutivo,
  RitmoMeta,
  TabelaDetalhe,
} from './executivo.types';

const TTL_SERIES_MS = 5 * 60 * 1000;
const TTL_AGORA_MS = 60 * 1000;
const MESES_DE_DIARIA = 13;

interface LinhaFonte {
  fonte: string;
  nome_exibicao: string;
  status: string | null;
  rotulo: string;
  ultima_sync: string | null;
}

@Injectable()
export class ExecutivoService {
  private readonly logger = new Logger(ExecutivoService.name);
  private readonly cache = new Map<string, { ate: number; dado: unknown }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly metas: MetasService,
  ) {}

  /** Limpa o cache — o botão "Atualizar dados" e toda escrita de meta chamam. */
  invalidar(): void {
    this.cache.clear();
  }

  private async lembrar<T>(chave: string, ttlMs: number, buscar: () => Promise<T>): Promise<T> {
    const agora = Date.now();
    const guardado = this.cache.get(chave);
    if (guardado && guardado.ate > agora) return guardado.dado as T;
    const dado = await buscar();
    this.cache.set(chave, { ate: agora + ttlMs, dado });
    return dado;
  }

  /* ------------------------- primitivas de dado ------------------------- */

  private hoje(): Promise<string> {
    return this.lembrar('hoje', TTL_AGORA_MS, async () => {
      const [linha] = await this.prisma.$queryRaw<{ hoje: string }[]>`
        SELECT to_char((now() AT TIME ZONE 'America/Bahia')::date, 'YYYY-MM-DD') AS hoje`;
      return linha.hoje;
    });
  }

  private fontes(): Promise<Map<string, LinhaFonte>> {
    return this.lembrar('fontes', TTL_AGORA_MS, async () => {
      const linhas = await this.prisma.$queryRaw<
        (Omit<LinhaFonte, 'ultima_sync'> & { ultima_sync: Date | null })[]
      >`SELECT fonte, nome_exibicao, status, rotulo, ultima_sync FROM public.vw_integracao_status`;
      return new Map(
        linhas.map((l) => [
          l.fonte,
          { ...l, ultima_sync: l.ultima_sync ? l.ultima_sync.toISOString() : null },
        ]),
      );
    });
  }

  private serieMensal(def: DefinicaoIndicador): Promise<PontoMensal[]> {
    if (!def.sql.serieMensal) return Promise.resolve([]);
    return this.lembrar(`mensal:${def.codigo}`, TTL_SERIES_MS, async () => {
      const linhas = await this.prisma.$queryRawUnsafe<{ mes: string; valor: number | null }[]>(
        def.sql.serieMensal!,
      );
      return linhas
        .filter((l) => l.valor != null)
        .map((l) => ({ mes: l.mes, valor: Number(l.valor) }));
    });
  }

  private serieDiaria(def: DefinicaoIndicador, de: string, ate: string): Promise<PontoDiario[]> {
    if (!def.sql.serieDiaria) return Promise.resolve([]);
    return this.lembrar(`diaria:${def.codigo}:${de}:${ate}`, TTL_SERIES_MS, async () => {
      const linhas = await this.prisma.$queryRawUnsafe<{ dia: string; valor: number | null }[]>(
        def.sql.serieDiaria!,
        de,
        ate,
      );
      return linhas
        .filter((l) => l.valor != null)
        .map((l) => ({ dia: l.dia, valor: Number(l.valor) }));
    });
  }

  private estadoAtual(
    def: DefinicaoIndicador,
  ): Promise<{ valor: number | null; quantidade: number | null; referencia: string | null }> {
    return this.lembrar(`estado:${def.codigo}`, TTL_SERIES_MS, async () => {
      const [linha] = await this.prisma.$queryRawUnsafe<
        { valor: number | null; quantidade: number | null; referencia: string | null }[]
      >(def.sql.estadoAtual!);
      return {
        valor: linha?.valor != null ? Number(linha.valor) : null,
        quantidade: linha?.quantidade != null ? Number(linha.quantidade) : null,
        referencia: linha?.referencia ?? null,
      };
    });
  }

  private cobreAte(def: DefinicaoIndicador): Promise<string | null> {
    return this.lembrar(`cobre:${def.codigo}`, TTL_SERIES_MS, async () => {
      const [linha] = await this.prisma.$queryRawUnsafe<{ ate: string | null }[]>(def.sql.cobreAte);
      return linha?.ate ?? null;
    });
  }

  /* --------------------------- qualidade --------------------------- */

  private montarQualidade(
    def: DefinicaoIndicador,
    cobreAte: string | null,
    fontes: Map<string, LinhaFonte>,
    hoje: string,
  ): QualidadeDado {
    const fonte = fontes.get(def.fonte.integracao);
    const base = {
      fonte: def.fonte.integracao,
      fonteRotulo: fonte?.nome_exibicao ?? def.fonte.rotulo,
      cobreAte,
      ultimaSync: fonte?.ultima_sync ?? null,
    };
    const dataBr = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

    if (fonte && (fonte.status == null || fonte.rotulo === 'Nunca sincronizado')) {
      return {
        ...base,
        nivel: 'critico',
        rotulo: `Fonte não conectada — dados congelados${cobreAte ? ` em ${dataBr(cobreAte)}` : ''}`,
      };
    }
    if (fonte?.status === 'erro') {
      return {
        ...base,
        nivel: 'critico',
        rotulo: `Falha na sincronização — dados até ${cobreAte ? dataBr(cobreAte) : 'data desconhecida'}`,
      };
    }
    // Fonte saudável (ou sem linha de integração — dado carregado pelo portal):
    // o que manda é até onde o dado cobre.
    if (cobreAte) {
      const limite = new Date(`${hoje}T00:00:00Z`).getTime() - 3 * 86_400_000;
      if (new Date(`${cobreAte}T00:00:00Z`).getTime() < limite) {
        return { ...base, nivel: 'atencao', rotulo: `Dados até ${dataBr(cobreAte)}` };
      }
      return { ...base, nivel: 'ok', rotulo: `Dados até ${dataBr(cobreAte)}` };
    }
    return { ...base, nivel: 'atencao', rotulo: 'Sem dado carregado' };
  }

  /* ----------------------------- o card ----------------------------- */

  private async montarCard(
    def: DefinicaoIndicador,
    mesRef: string,
    hoje: string,
    metas: MetasDoMes,
    fontes: Map<string, LinhaFonte>,
  ): Promise<CardIndicador> {
    const [serie, cobre] = await Promise.all([this.serieMensal(def), this.cobreAte(def)]);
    const qualidade = this.montarQualidade(def, cobre, fontes, hoje);
    const mesCorrente = mesDe(hoje);
    const parcial = def.tipo === 'fluxo' && mesRef === mesCorrente;
    const diaAtual = Number(hoje.slice(8, 10));
    const meta = def.metaFonte ? (metas.porIndicador.get(def.codigo) ?? null) : null;

    const base = {
      codigo: def.codigo,
      nome: def.nome,
      curto: def.curto,
      descricao: def.descricao,
      setor: def.setor,
      setorNome: NOME_SETOR[def.setor] ?? def.setor,
      unidade: def.unidade,
      direcao: def.direcao,
      tipo: def.tipo,
      razao: !!def.razao,
      naVisaoGeral: def.naVisaoGeral,
      ordem: def.ordem,
      mes: mesRef,
      qualidade,
      cobertura: def.cobertura ?? null,
    };

    /* ---------- estado: fotografia do agora ---------- */
    if (def.tipo === 'estado') {
      const estado = await this.estadoAtual(def);
      const status = statusCard({
        direcao: def.direcao,
        meta: meta?.valor ?? null,
        esperado: null,
        realizado: estado.valor,
        parcial: false,
        projecaoCentral: null,
        historicoMeses: 99, // estado não depende de série para ser informativo
      });
      return {
        ...base,
        parcial: false,
        valor: estado.valor,
        quantidade: estado.quantidade,
        referencia: estado.referencia ?? cobre,
        meta,
        pctMeta: meta && estado.valor != null && meta.valor > 0 ? (estado.valor / meta.valor) * 100 : null,
        esperado: null,
        desvioEsperado: null,
        reguaEsperado: null,
        comparacoes: null,
        tendencia: null,
        projecao: null,
        status,
        texto: null,
        serie: null,
      };
    }

    /* ---------- fluxo: soma (ou razão) do período ---------- */
    const serieFechada = serie.filter((p) => p.mes < mesCorrente);
    const noMes = serie.find((p) => p.mes === mesRef) ?? null;

    let valor: number | null;
    let diaria: PontoDiario[] = [];
    let distr: DistribuicaoIntraMes | null = null;

    if (parcial && !def.razao && def.sql.serieDiaria) {
      diaria = await this.serieDiaria(def, somarMeses(mesRef, -MESES_DE_DIARIA), somarMeses(mesRef, 1));
      valor = somaAteDia(diaria, mesRef, diaAtual);
      distr = distribuicaoIntraMes(diaria, mesRef);
    } else {
      // Mês fechado sem linha na série = mês sem movimento (0), desde que o
      // mês esteja dentro do histórico coberto; fora dele é "sem dados".
      const dentroDoHistorico =
        serie.length > 0 && mesRef >= serie[0].mes && (parcial || mesRef <= mesCorrente);
      valor = noMes?.valor ?? (dentroDoHistorico && !def.razao ? 0 : (noMes?.valor ?? null));
      if (parcial && def.razao) valor = noMes?.valor ?? null;
    }

    const regua = parcial && !def.razao ? fracaoEsperada(distr, mesRef, diaAtual) : null;
    const esperado = parcial && meta && regua ? meta.valor * regua.fracao : null;
    const projecao =
      parcial && !def.razao && valor != null ? projetarMes(valor, diaAtual, mesRef, distr) : null;

    const comparacoes =
      valor != null
        ? calcularComparacoes({
            serieFechada,
            mesRef,
            valorRef: valor,
            parcial,
            diaAtual: parcial ? diaAtual : undefined,
            diasHistorico: parcial && !def.razao ? diaria : undefined,
          })
        : null;

    const status = statusCard({
      direcao: def.direcao,
      meta: meta?.valor ?? null,
      esperado,
      realizado: valor,
      parcial,
      projecaoCentral: projecao?.central ?? null,
      historicoMeses: serieFechada.length,
    });

    const sparkMeses = serie.filter((p) => p.mes <= mesRef).slice(-MESES_DE_DIARIA);
    const spark = sparkMeses.map((p) => ({
      mes: p.mes,
      // No mês parcial o valor exibido é o MTD calculado, não a linha da série
      // (que pode estar minutos atrás do cache diário).
      valor: p.mes === mesRef && parcial && valor != null ? valor : p.valor,
      ...(p.mes === mesCorrente ? { parcial: true } : {}),
    }));

    const texto =
      valor != null && comparacoes
        ? textoExecutivo({
            nome: def.curto,
            formatar: (v) => fmtValor(def.unidade, v),
            direcao: def.direcao,
            realizado: valor,
            esperado,
            meta: meta?.valor ?? null,
            parcial,
            comparacoes,
            projecao,
          })
        : null;

    return {
      ...base,
      parcial,
      valor,
      quantidade: null,
      referencia: null,
      meta,
      pctMeta: meta && valor != null && meta.valor > 0 ? (valor / meta.valor) * 100 : null,
      esperado,
      desvioEsperado: esperado != null && valor != null ? valor - esperado : null,
      reguaEsperado: regua?.regua ?? null,
      comparacoes,
      tendencia: tendenciaDe(serieFechada),
      projecao,
      status,
      texto,
      serie: spark,
    };
  }

  /* ----------------------------- resumo ----------------------------- */

  async resumo(usuario: UsuarioLogado, mes?: string): Promise<ResumoExecutivo> {
    const hoje = await this.hoje();
    const mesCorrente = mesDe(hoje);
    const mesRef = normalizarMes(mes) ?? mesCorrente;

    const visiveis = INDICADORES.filter((d) => podeVer(usuario, [d.setor]));
    const [metas, fontes] = await Promise.all([this.metas.doMes(mesRef), this.fontes()]);

    const cards = await Promise.all(
      visiveis.map((d) => this.montarCard(d, mesRef, hoje, metas, fontes)),
    );
    cards.sort((a, b) => a.ordem - b.ordem);

    const fatores = await this.fatoresDeAlertas(cards, mesRef, hoje);
    const { alertas, destaques } = gerarAlertas({
      cards,
      fatoresPorIndicador: fatores,
      diaAtual: Number(hoje.slice(8, 10)),
    });

    const setores: BlocoSetor[] = [];
    for (const c of cards) {
      let bloco = setores.find((s) => s.setor === c.setor);
      if (!bloco) {
        bloco = { setor: c.setor, nome: c.setorNome, indicadores: [], alertas: 0, destaques: 0, qualidade: 'ok' };
        setores.push(bloco);
      }
      bloco.indicadores.push(c.codigo);
      if (c.qualidade.nivel === 'critico') bloco.qualidade = 'critico';
      else if (c.qualidade.nivel === 'atencao' && bloco.qualidade === 'ok') bloco.qualidade = 'atencao';
    }
    for (const a of alertas) {
      const bloco = setores.find((s) => s.setor === a.setor);
      if (bloco) bloco.alertas++;
    }
    for (const d of destaques) {
      const bloco = setores.find((s) => s.setor === d.setor);
      if (bloco) bloco.destaques++;
    }

    const fontesResumo: FonteResumo[] = [...fontes.values()]
      .map((f) => ({
        fonte: f.fonte,
        nome: f.nome_exibicao,
        status: f.status ?? 'nunca',
        rotulo: f.rotulo,
        ultimaSync: f.ultima_sync,
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome));

    return {
      referencia: {
        hoje,
        mes: mesRef,
        mesCorrente,
        parcial: mesRef === mesCorrente,
        diaAtual: Number(hoje.slice(8, 10)),
        diasNoMes: diasNoMes(mesRef),
      },
      cards,
      alertas,
      destaques,
      setores,
      fontes: fontesResumo,
      geradoEm: new Date().toISOString(),
    };
  }

  /**
   * "Possíveis fatores a investigar": para os indicadores com quebra por
   * categoria/curso, mede qual fatia mais piorou contra o mês anterior.
   * Só roda para os cards em vermelho/queda — 2 consultas por card, no máximo.
   */
  private async fatoresDeAlertas(
    cards: CardIndicador[],
    mesRef: string,
    hoje: string,
  ): Promise<Map<string, string[]>> {
    const fatores = new Map<string, string[]>();
    const candidatos = cards.filter(
      (c) =>
        (c.status.nivel === 'vermelho' ||
          (c.comparacoes?.mesAnterior?.pct != null &&
            (c.direcao === 'menor_melhor'
              ? c.comparacoes.mesAnterior.pct >= 20
              : c.comparacoes.mesAnterior.pct <= -20))) &&
        c.tipo === 'fluxo',
    );

    await Promise.all(
      candidatos.slice(0, 4).map(async (c) => {
        const def = indicadorPorCodigo(c.codigo);
        const dim = def?.dimensoes.find((d) => ['categoria', 'curso', 'campanha'].includes(d.codigo));
        if (!def || !dim) return;
        try {
          const mesAnterior = somarMeses(mesRef, -1);
          const [atual, anterior] = await Promise.all([
            this.quebra(def, dim.codigo, mesRef, somarMeses(mesRef, 1)),
            this.quebra(def, dim.codigo, mesAnterior, mesRef),
          ]);
          const antesPor = new Map(anterior.linhas.map((l) => [l.rotulo, l.valor]));
          const deltas = atual.linhas
            .map((l) => ({ rotulo: l.rotulo, delta: l.valor - (antesPor.get(l.rotulo) ?? 0) }))
            .sort((a, b) =>
              c.direcao === 'menor_melhor' ? b.delta - a.delta : a.delta - b.delta,
            )
            .slice(0, 2)
            .filter((l) => Math.abs(l.delta) > 0);
          if (deltas.length) {
            fatores.set(
              c.codigo,
              deltas.map(
                (l) =>
                  `${dim.nome.replace('Por ', '')} "${l.rotulo}": ${l.delta >= 0 ? '+' : '−'}${fmtValor(c.unidade === 'qtd' ? 'qtd' : 'brl', Math.abs(l.delta))} vs. mês anterior`,
              ),
            );
          }
        } catch (e) {
          this.logger.warn(`fatores(${c.codigo}): ${(e as Error).message}`);
        }
      }),
    );
    return fatores;
  }

  /* ------------------------ tela analítica ------------------------ */

  private exigirIndicador(usuario: UsuarioLogado, codigo: string): DefinicaoIndicador {
    const def = indicadorPorCodigo(codigo);
    if (!def) {
      throw new NotFoundException({ codigo: 'INDICADOR_DESCONHECIDO', message: 'Recurso não encontrado' });
    }
    if (!podeVer(usuario, [def.setor])) {
      throw new ForbiddenException({ codigo: 'SETOR_NEGADO', message: 'Seu perfil não tem acesso a este setor' });
    }
    return def;
  }

  private async quebra(
    def: DefinicaoIndicador,
    dimensao: string,
    de: string,
    ateExclusivo: string,
  ): Promise<QuebraDimensao> {
    const dim = def.dimensoes.find((d) => d.codigo === dimensao)!;
    const linhas = await this.prisma.$queryRawUnsafe<
      { rotulo: string; valor: number | null; quantidade: number | null }[]
    >(dim.sql, de, ateExclusivo);
    return {
      codigo: dim.codigo,
      nome: dim.nome,
      linhas: linhas.map((l) => ({
        rotulo: l.rotulo,
        valor: Number(l.valor ?? 0),
        quantidade: l.quantidade != null ? Number(l.quantidade) : null,
      })),
    };
  }

  async detalheIndicador(
    usuario: UsuarioLogado,
    codigo: string,
    mes?: string,
    de?: string,
    ate?: string,
  ): Promise<DetalheIndicadorResposta> {
    const def = this.exigirIndicador(usuario, codigo);
    const hoje = await this.hoje();
    const mesRef = normalizarMes(mes) ?? mesDe(hoje);
    const [metas, fontes] = await Promise.all([this.metas.doMes(mesRef), this.fontes()]);
    const card = await this.montarCard(def, mesRef, hoje, metas, fontes);

    const inicio = normalizarMes(de) ?? mesRef;
    const fimMes = normalizarMes(ate) ?? mesRef;
    const fimExclusivo = somarMeses(fimMes, 1);

    const quebras = await Promise.all(
      def.dimensoes.map((d) => this.quebra(def, d.codigo, inicio, fimExclusivo)),
    );

    const serie = await this.serieMensal(def);
    const mesCorrente = mesDe(hoje);

    return {
      card,
      formula: def.formula,
      fonteTabela: def.fonte.tabela,
      serieCompleta: serie.map((p) => ({
        mes: p.mes,
        valor: p.valor,
        ...(p.mes === mesCorrente ? { parcial: true } : {}),
      })),
      quebras,
      periodo: { de: inicio, ate: fimMes },
      temTabela: !!def.detalhe,
      colunas: def.detalhe?.colunas ?? null,
    };
  }

  async tabelaDetalhe(
    usuario: UsuarioLogado,
    codigo: string,
    de: string | undefined,
    ate: string | undefined,
    pagina: number,
    porPagina: number,
  ): Promise<TabelaDetalhe> {
    const def = this.exigirIndicador(usuario, codigo);
    if (!def.detalhe) {
      throw new NotFoundException({ codigo: 'SEM_TABELA', message: 'Este indicador não tem tabela de detalhe' });
    }
    const hoje = await this.hoje();
    const inicio = normalizarMes(de) ?? mesDe(hoje);
    const fimExclusivo = somarMeses(normalizarMes(ate) ?? mesDe(hoje), 1);
    const p = Math.max(1, pagina);
    const por = Math.min(Math.max(porPagina, 10), 200);

    const [linhas, [total]] = await Promise.all([
      this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        def.detalhe.sql,
        inicio,
        fimExclusivo,
        por,
        (p - 1) * por,
      ),
      this.prisma.$queryRawUnsafe<{ total: number; soma: number | null }[]>(
        def.detalhe.sqlTotal,
        inicio,
        fimExclusivo,
      ),
    ]);

    return {
      colunas: def.detalhe.colunas,
      linhas: linhas.map(semBigInt),
      pagina: p,
      porPagina: por,
      total: Number(total?.total ?? 0),
      soma: total?.soma != null ? Number(total.soma) : null,
    };
  }

  /* ------------------------- ritmo da meta ------------------------- */

  async ritmo(usuario: UsuarioLogado, codigo: string, mes?: string): Promise<RitmoMeta> {
    const def = this.exigirIndicador(usuario, codigo);
    if (def.tipo !== 'fluxo' || def.razao || !def.sql.serieDiaria) {
      throw new NotFoundException({
        codigo: 'SEM_RITMO',
        message: 'Este indicador não tem acompanhamento diário',
      });
    }
    const hoje = await this.hoje();
    const mesCorrente = mesDe(hoje);
    const mesRef = normalizarMes(mes) ?? mesCorrente;
    const parcial = mesRef === mesCorrente;
    const diaAtual = Number(hoje.slice(8, 10));
    const totalDias = diasNoMes(mesRef);

    const [diaria, metas] = await Promise.all([
      this.serieDiaria(def, somarMeses(mesRef, -MESES_DE_DIARIA), somarMeses(mesRef, 1)),
      this.metas.doMes(mesRef),
    ]);
    const meta = def.metaFonte ? (metas.porIndicador.get(def.codigo) ?? null) : null;
    const distr = distribuicaoIntraMes(diaria, mesRef);
    const regua = fracaoEsperada(distr, mesRef, 1); // só para expor a régua usada

    const porDia = new Map<number, number>();
    for (const p of diaria) {
      if (mesDe(p.dia) !== mesRef) continue;
      porDia.set(Number(p.dia.slice(8, 10)), p.valor);
    }

    const limiteRealizado = parcial ? diaAtual : totalDias;
    const realizadoAteHoje = somaAteDia(diaria, mesRef, limiteRealizado);
    const projecao = parcial ? projetarMes(realizadoAteHoje, diaAtual, mesRef, distr) : null;

    const pontos: PontoRitmo[] = [];
    let acumulado = 0;
    for (let d = 1; d <= totalDias; d++) {
      const dentroDoRealizado = d <= limiteRealizado;
      if (dentroDoRealizado) acumulado += porDia.get(d) ?? 0;
      const { fracao } = fracaoEsperada(distr, mesRef, d);
      pontos.push({
        dia: `${mesRef.slice(0, 7)}-${String(d).padStart(2, '0')}`,
        realizado: dentroDoRealizado ? acumulado : null,
        esperado: meta ? meta.valor * fracao : null,
        projetado:
          projecao && d >= limiteRealizado ? projecao.central * fracao : null,
        faixaMin: projecao?.faixaMin != null && d >= limiteRealizado ? projecao.faixaMin * fracao : null,
        faixaMax: projecao?.faixaMax != null && d >= limiteRealizado ? projecao.faixaMax * fracao : null,
      });
    }

    return {
      codigo: def.codigo,
      mes: mesRef,
      parcial,
      hoje: parcial ? hoje : null,
      meta: meta?.valor ?? null,
      metaOrigem: meta?.origem ?? null,
      pontos,
      projecao,
      reguaEsperado: regua.regua,
    };
  }

  /* ----------------------- consolidado anual ----------------------- */

  async anual(usuario: UsuarioLogado, codigo: string): Promise<AnualIndicador> {
    const def = this.exigirIndicador(usuario, codigo);
    if (def.tipo !== 'fluxo') {
      throw new NotFoundException({ codigo: 'SEM_ANUAL', message: 'Indicador de estado não tem consolidado anual' });
    }
    const hoje = await this.hoje();
    const mesCorrente = mesDe(hoje);
    const anoCorrente = Number(hoje.slice(0, 4));

    const serie = await this.serieMensal(def);
    const serieFechada = serie.filter((p) => p.mes < mesCorrente);

    // Razões consolidam por MÉDIA anual (somar ticket médio não significa nada).
    const linhasBase = def.razao
      ? consolidadoAnual(serie, anoCorrente).map((l) => ({ ...l, total: l.mediaMensal }))
      : consolidadoAnual(serie, anoCorrente);

    const metasAno = new Map<number, number | null>();
    for (const l of linhasBase) {
      metasAno.set(l.ano, def.metaFonte ? await this.metas.doAno(def.codigo, l.ano) : null);
    }

    let projecaoAnoCorrente = null;
    if (!def.razao) {
      const metas = await this.metas.doMes(mesCorrente);
      const cardMeta = metas.porIndicador.get(def.codigo) ?? null;
      let projecaoMes = null;
      if (def.sql.serieDiaria) {
        const diaria = await this.serieDiaria(def, somarMeses(mesCorrente, -MESES_DE_DIARIA), somarMeses(mesCorrente, 1));
        const diaAtual = Number(hoje.slice(8, 10));
        const mtd = somaAteDia(diaria, mesCorrente, diaAtual);
        projecaoMes = projetarMes(mtd, diaAtual, mesCorrente, distribuicaoIntraMes(diaria, mesCorrente));
      }
      projecaoAnoCorrente = projetarAno(serieFechada, anoCorrente, mesCorrente, projecaoMes);
      void cardMeta; // meta anual entra pelas linhas; a mensal não muda a projeção
    }

    return {
      codigo: def.codigo,
      nome: def.nome,
      unidade: def.unidade,
      linhas: linhasBase.map((l) => ({ ...l, metaAno: metasAno.get(l.ano) ?? null })),
      projecaoAnoCorrente,
      serieMensal: serie.map((p) => ({
        mes: p.mes,
        valor: p.valor,
        ...(p.mes === mesCorrente ? { parcial: true } : {}),
      })),
    };
  }

  /* --------------------------- exportação --------------------------- */

  async exportarResumoCsv(usuario: UsuarioLogado, mes: string | undefined, ip?: string): Promise<string> {
    const resumo = await this.resumo(usuario, mes);
    const linhas = [
      ['indicador', 'setor', 'mes', 'parcial', 'valor', 'meta', 'origem_meta', 'esperado_ate_hoje',
        'projecao', 'confianca', 'status', 'vs_mes_anterior_pct', 'vs_ano_anterior_pct'].join(';'),
      ...resumo.cards.map((c) =>
        [
          c.nome, c.setorNome, c.mes.slice(0, 7), c.parcial ? 'sim' : 'nao',
          num(c.valor), num(c.meta?.valor ?? null), c.meta?.origem ?? '',
          num(c.esperado), num(c.projecao?.central ?? null), c.projecao?.confianca ?? '',
          c.status.rotulo, num(c.comparacoes?.mesAnterior?.pct ?? null),
          num(c.comparacoes?.anoAnterior?.pct ?? null),
        ].join(';'),
      ),
    ];
    await this.auditar(usuario, 'hub_exportacao', `executivo/resumo/${mes ?? 'corrente'}`, ip);
    // BOM para o Excel abrir em UTF-8 sem perguntar.
    return `﻿${linhas.join('\r\n')}`;
  }

  async exportarDetalheCsv(
    usuario: UsuarioLogado,
    codigo: string,
    de: string | undefined,
    ate: string | undefined,
    ip?: string,
  ): Promise<string> {
    const def = this.exigirIndicador(usuario, codigo);
    if (!def.detalhe) {
      throw new NotFoundException({ codigo: 'SEM_TABELA', message: 'Este indicador não tem tabela de detalhe' });
    }
    // Uma página gigante única: teto de 50 mil linhas para não derrubar nada.
    const hoje = await this.hoje();
    const inicio = normalizarMes(de) ?? mesDe(hoje);
    const fimExclusivo = somarMeses(normalizarMes(ate) ?? mesDe(hoje), 1);
    const linhas = await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      def.detalhe.sql,
      inicio,
      fimExclusivo,
      50_000,
      0,
    );
    const cols = def.detalhe.colunas;
    const csv = [
      cols.map((c) => c.nome).join(';'),
      ...linhas.map((l) => cols.map((c) => campoCsv(l[c.chave])).join(';')),
    ];
    await this.auditar(usuario, 'hub_exportacao', `executivo/${codigo}/${inicio.slice(0, 7)}`, ip);
    return `﻿${csv.join('\r\n')}`;
  }

  /* ------------------------- preferências ------------------------- */

  async lerPreferencias(usuario: UsuarioLogado): Promise<{ empresa: PreferenciasHub; minhas: PreferenciasHub }> {
    const [empresa, minhas] = await Promise.all([
      this.prisma.hubPreferencia.findUnique({ where: { id: 'empresa' } }),
      this.prisma.hubPreferencia.findUnique({ where: { id: usuario.id } }),
    ]);
    return {
      empresa: (empresa?.config as PreferenciasHub) ?? {},
      minhas: (minhas?.config as PreferenciasHub) ?? {},
    };
  }

  async gravarPreferencias(
    usuario: UsuarioLogado,
    config: PreferenciasHub,
    daEmpresa: boolean,
    ip?: string,
  ): Promise<void> {
    if (daEmpresa && usuario.papel !== 'admin') {
      throw new ForbiddenException({ codigo: 'SOMENTE_ADMIN', message: 'Só admin altera a visão padrão da empresa' });
    }
    const id = daEmpresa ? 'empresa' : usuario.id;
    const limpo = limparPreferencias(config);
    await this.prisma.hubPreferencia.upsert({
      where: { id },
      create: { id, config: limpo as object },
      update: { config: limpo as object, atualizadoEm: new Date() },
    });
    if (daEmpresa) await this.auditar(usuario, 'hub_visao_empresa', 'executivo/preferencias/empresa', ip);
  }

  async registrarAtualizacaoManual(usuario: UsuarioLogado, ip?: string): Promise<void> {
    this.invalidar();
    await this.auditar(usuario, 'hub_atualizacao_manual', 'executivo/atualizar', ip);
  }

  private auditar(usuario: UsuarioLogado, acao: string, recurso: string, ip?: string): Promise<unknown> {
    return this.prisma.auditoriaAcesso
      .create({ data: { usuarioId: usuario.id, acao, recurso, ip } })
      .catch(() => undefined);
  }
}

/* ------------------------------ util ------------------------------ */

function normalizarMes(mes?: string): string | null {
  if (!mes) return null;
  if (/^\d{4}-\d{2}$/.test(mes)) return `${mes}-01`;
  if (/^\d{4}-\d{2}-01$/.test(mes)) return mes;
  return null;
}

const num = (v: number | null): string =>
  v == null ? '' : v.toLocaleString('pt-BR', { maximumFractionDigits: 2, useGrouping: false });

function campoCsv(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'number') return num(v);
  if (typeof v === 'bigint') return String(v);
  const s = String(v);
  return /[;"\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

function semBigInt(linha: Record<string, unknown>): Record<string, unknown> {
  const saida: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(linha)) saida[k] = typeof v === 'bigint' ? Number(v) : v;
  return saida;
}

function limparPreferencias(c: PreferenciasHub): PreferenciasHub {
  const soCodigos = (xs?: string[]) =>
    Array.isArray(xs) ? xs.filter((x) => typeof x === 'string').slice(0, 60) : undefined;
  return {
    ordem: soCodigos(c.ordem),
    ocultos: soCodigos(c.ocultos),
    favoritos: soCodigos(c.favoritos),
    comparacaoPadrao: typeof c.comparacaoPadrao === 'string' ? c.comparacaoPadrao.slice(0, 30) : undefined,
    setoresPrioritarios: soCodigos(c.setoresPrioritarios),
  };
}
