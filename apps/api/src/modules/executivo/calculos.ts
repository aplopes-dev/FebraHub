/**
 * Motor de cálculo do Hub Executivo — funções PURAS.
 *
 * Tudo aqui recebe séries prontas e devolve números; nada toca banco, relógio
 * ou timezone. "Hoje" entra por parâmetro (o service o obtém do Postgres em
 * America/Bahia — a mesma referência do restante do sistema), e as datas são
 * strings ISO (YYYY-MM-DD / YYYY-MM-01), comparáveis por ordenação lexical.
 * É o que permite testar cada regra da spec com jest, sem mock de Date.
 *
 * As regras que importam:
 *
 *  ESPERADO ATÉ HOJE — não é meta/30*dia. A fração esperada do mês vem da
 *  distribuição REAL dos últimos meses fechados (quanto do total do mês
 *  historicamente já aconteceu até o dia d). Fim de semana, feriado e o "dia
 *  20 concentra boleto" entram sozinhos, porque estão no histórico. Dias
 *  úteis viram fallback só quando não há histórico diário que preste.
 *
 *  PROJEÇÃO — realizado ÷ fração esperada. A faixa provável vem de aplicar a
 *  fração de CADA mês histórico (não a média): meses que atrasam e meses que
 *  adiantam produzem o leque. Projeção nunca é certeza e o campo `metodo`
 *  diz em português como o número nasceu.
 *
 *  COMPARAÇÃO PARCIAL — mês em curso compara com o MESMO Nº DE DIAS do mês
 *  anterior e do ano anterior (docs/DESCOBERTAS.md §9: 14 dias de julho
 *  contra junho inteiro dá "-99%", tecnicamente correto e completamente
 *  enganoso). O flag `parcial` marca a comparação equivalente.
 */

/* ============================== tipos ============================== */

export interface PontoMensal {
  /** Primeiro dia do mês, YYYY-MM-DD. */
  mes: string;
  valor: number;
}

export interface PontoDiario {
  /** YYYY-MM-DD. */
  dia: string;
  valor: number;
}

export type Confianca = 'alta' | 'media' | 'baixa' | 'insuficiente';

export interface Projecao {
  central: number;
  faixaMin: number | null;
  faixaMax: number | null;
  confianca: Confianca;
  /** Como o número nasceu, em português de gente. */
  metodo: string;
}

export interface Comparacao {
  /** Valor da base de comparação (já equivalente, se parcial). */
  base: number;
  delta: number;
  /** null quando a base é 0 (variação % não significa nada). */
  pct: number | null;
  /** true = comparei os mesmos N dias, não o mês cheio. */
  parcial: boolean;
}

export interface ReferenciaMes {
  mes: string;
  valor: number;
}

export interface Comparacoes {
  mesAnterior: Comparacao | null;
  anoAnterior: Comparacao | null;
  media3: Comparacao | null;
  media6: Comparacao | null;
  media12: Comparacao | null;
  melhorMes: ReferenciaMes | null;
  piorMes: ReferenciaMes | null;
}

export type Direcao = 'maior_melhor' | 'menor_melhor' | 'neutra';
export type NivelStatus = 'verde' | 'amarelo' | 'vermelho' | 'neutro' | 'cinza';

export interface Status {
  nivel: NivelStatus;
  rotulo: string;
}

export type Tendencia = 'subindo' | 'caindo' | 'estavel';

/* ============================ datas ============================ */

export const mesDe = (iso: string): string => `${iso.slice(0, 7)}-01`;

export const diasNoMes = (mesIso: string): number => {
  const ano = Number(mesIso.slice(0, 4));
  const mes = Number(mesIso.slice(5, 7));
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
};

/** Soma meses a um YYYY-MM-01 sem passar por Date local (fuso não entra aqui). */
export const somarMeses = (mesIso: string, n: number): string => {
  const ano = Number(mesIso.slice(0, 4));
  const mes = Number(mesIso.slice(5, 7)) - 1 + n;
  const a = ano + Math.floor(mes / 12);
  const m = ((mes % 12) + 12) % 12;
  return `${a}-${String(m + 1).padStart(2, '0')}-01`;
};

/** Dias úteis (seg–sex) entre o dia 1 e o dia `ate` do mês, inclusive. */
export const diasUteisAte = (mesIso: string, ate: number): number => {
  const ano = Number(mesIso.slice(0, 4));
  const mes = Number(mesIso.slice(5, 7)) - 1;
  let uteis = 0;
  for (let d = 1; d <= ate; d++) {
    const dow = new Date(Date.UTC(ano, mes, d)).getUTCDay();
    if (dow !== 0 && dow !== 6) uteis++;
  }
  return uteis;
};

/* ================== distribuição intra-mês ================== */

export interface DistribuicaoIntraMes {
  /** Fração média do mês realizada até o dia d (0..1). */
  fracao: (dia: number) => number;
  /** Fração de CADA mês histórico no dia d — é daqui que sai a faixa. */
  fracoesNoDia: (dia: number) => number[];
  /** Quantos meses fechados sustentam a curva. */
  meses: number;
}

/**
 * Aprende com as séries diárias dos meses FECHADOS qual fatia do mês já
 * aconteceu até cada dia. Meses de tamanhos diferentes alinham pelo índice do
 * dia; depois do último dia de um mês curto, a fração dele é 1 (o mês acabou).
 * Meses de total zero ou negativo ficam de fora — não há distribuição a
 * aprender de um mês sem movimento.
 */
export function distribuicaoIntraMes(
  dias: readonly PontoDiario[],
  mesExcluido: string,
  maxMeses = 12,
): DistribuicaoIntraMes {
  const porMes = new Map<string, number[]>();
  for (const p of dias) {
    const mes = mesDe(p.dia);
    if (mes === mesExcluido) continue;
    const arr = porMes.get(mes) ?? new Array<number>(diasNoMes(mes)).fill(0);
    const idx = Number(p.dia.slice(8, 10)) - 1;
    if (idx >= 0 && idx < arr.length) arr[idx] += p.valor;
    porMes.set(mes, arr);
  }

  const cumulativas: number[][] = [];
  const mesesOrdenados = [...porMes.keys()].sort().slice(-maxMeses);
  for (const mes of mesesOrdenados) {
    const arr = porMes.get(mes)!;
    const total = arr.reduce((s, v) => s + v, 0);
    if (total <= 0) continue;
    let acc = 0;
    cumulativas.push(arr.map((v) => (acc += v) / total));
  }

  const fracoesNoDia = (dia: number): number[] =>
    cumulativas.map((c) => c[Math.min(Math.max(dia, 1), c.length) - 1]);

  return {
    meses: cumulativas.length,
    fracoesNoDia,
    fracao: (dia: number): number => {
      const fs = fracoesNoDia(dia);
      if (!fs.length) return 0;
      return fs.reduce((s, v) => s + v, 0) / fs.length;
    },
  };
}

/**
 * Fração esperada do mês até o dia `dia`, com a régua degradando na ordem da
 * spec: distribuição histórica → dias úteis → linear. Devolve também qual
 * régua foi usada, porque o card explica o próprio cálculo.
 */
export function fracaoEsperada(
  distr: DistribuicaoIntraMes | null,
  mesIso: string,
  dia: number,
): { fracao: number; regua: 'historico' | 'dias_uteis' | 'linear' } {
  const total = diasNoMes(mesIso);
  const d = Math.min(Math.max(dia, 1), total);
  if (distr && distr.meses >= 3) {
    const f = distr.fracao(d);
    if (f > 0) return { fracao: Math.min(f, 1), regua: 'historico' };
  }
  const uteisTotal = diasUteisAte(mesIso, total);
  if (uteisTotal > 0) {
    return { fracao: Math.min(diasUteisAte(mesIso, d) / uteisTotal, 1), regua: 'dias_uteis' };
  }
  return { fracao: d / total, regua: 'linear' };
}

/* ========================= projeção ========================= */

const media = (xs: readonly number[]): number =>
  xs.length ? xs.reduce((s, v) => s + v, 0) / xs.length : 0;

/** Coeficiente de variação — mede o quão espalhadas as frações estão. */
const cv = (xs: readonly number[]): number => {
  if (xs.length < 2) return 0;
  const m = media(xs);
  if (m === 0) return 0;
  const dp = Math.sqrt(media(xs.map((v) => (v - m) ** 2)));
  return dp / m;
};

/**
 * Projeção de fechamento do mês em curso.
 *
 * Método principal: realizado ÷ fração histórica do dia. A faixa aplica a
 * fração de cada mês do histórico — não é intervalo estatístico formal, é
 * "se este mês se comportar como o mais lento/mais rápido dos últimos 12".
 * Sem histórico que preste, cai para a projeção linear por dias úteis e diz
 * isso no `metodo`. Nos 2 primeiros dias do mês não há projeção: qualquer
 * número dividido por uma fração de 2% é chute vestido de estimativa.
 */
export function projetarMes(
  realizadoAteHoje: number,
  diaAtual: number,
  mesIso: string,
  distr: DistribuicaoIntraMes | null,
): Projecao | null {
  if (diaAtual < 3) return null;

  const temHistorico = !!distr && distr.meses >= 3;
  if (temHistorico) {
    const fs = distr.fracoesNoDia(diaAtual).filter((f) => f >= 0.03);
    const fMedia = media(fs);
    if (fs.length >= 3 && fMedia >= 0.05) {
      const implicadas = fs.map((f) => realizadoAteHoje / f).sort((a, b) => a - b);
      const central = realizadoAteHoje / fMedia;
      const espalhamento = cv(fs);
      const confianca: Confianca =
        distr.meses >= 12 && espalhamento <= 0.25
          ? 'alta'
          : distr.meses >= 6 && espalhamento <= 0.45
            ? 'media'
            : 'baixa';
      return {
        central,
        faixaMin: implicadas[0],
        faixaMax: implicadas[implicadas.length - 1],
        confianca,
        metodo:
          `Projeção pelo ritmo: o realizado até o dia ${diaAtual} dividido pela fração ` +
          `que os últimos ${distr.meses} meses tinham realizado até este dia ` +
          `(${(fMedia * 100).toFixed(0)}% do mês, em média).`,
      };
    }
  }

  const { fracao, regua } = fracaoEsperada(null, mesIso, diaAtual);
  if (fracao < 0.05) return null;
  return {
    central: realizadoAteHoje / fracao,
    faixaMin: null,
    faixaMax: null,
    confianca: 'insuficiente',
    metodo:
      regua === 'dias_uteis'
        ? `Projeção simplificada por dias úteis (histórico diário insuficiente para a curva do mês).`
        : `Projeção linear simples (histórico insuficiente).`,
  };
}

export interface ProjecaoAnual extends Projecao {
  /** Quanto do ano já está fechado (soma dos meses encerrados). */
  fechado: number;
}

/**
 * Projeção do ano: meses fechados + projeção do mês corrente + estimativa dos
 * meses restantes. Cada mês restante usa a média DELE nos anos anteriores
 * (sazonalidade), quando houver pelo menos 2 anos; senão a média dos últimos
 * 12 fechados. A faixa herda a incerteza do mês corrente e a variação
 * histórica dos restantes.
 */
export function projetarAno(
  serieFechada: readonly PontoMensal[],
  anoRef: number,
  mesCorrente: string | null,
  projecaoMes: Projecao | null,
): ProjecaoAnual | null {
  const doAno = serieFechada.filter((p) => p.mes.startsWith(String(anoRef)));
  const fechado = doAno.reduce((s, p) => s + p.valor, 0);

  const mesesFechados = new Set(doAno.map((p) => p.mes));
  const restantes: string[] = [];
  for (let m = 1; m <= 12; m++) {
    const mes = `${anoRef}-${String(m).padStart(2, '0')}-01`;
    if (mesesFechados.has(mes)) continue;
    if (mesCorrente && mes === mesCorrente) continue;
    restantes.push(mes);
  }

  if (!doAno.length && !projecaoMes) return null;

  const porMesDoAno = new Map<number, number[]>();
  for (const p of serieFechada) {
    if (p.mes.startsWith(String(anoRef))) continue;
    const m = Number(p.mes.slice(5, 7));
    porMesDoAno.set(m, [...(porMesDoAno.get(m) ?? []), p.valor]);
  }
  const ultimos12 = serieFechada.slice(-12).map((p) => p.valor);
  const mediaGeral = media(ultimos12);

  let estimadoRestantes = 0;
  let sazonal = 0;
  for (const mes of restantes) {
    const historicoDoMes = porMesDoAno.get(Number(mes.slice(5, 7))) ?? [];
    if (historicoDoMes.length >= 2) {
      estimadoRestantes += media(historicoDoMes);
      sazonal++;
    } else {
      estimadoRestantes += mediaGeral;
    }
  }

  const doMesCorrente = projecaoMes?.central ?? 0;
  const central = fechado + doMesCorrente + estimadoRestantes;

  // Sem base para estimar os meses restantes = sem projeção anual honesta.
  if (restantes.length > 0 && mediaGeral === 0 && sazonal === 0) return null;

  const confianca: Confianca =
    restantes.length === 0
      ? (projecaoMes?.confianca ?? 'alta')
      : sazonal === restantes.length && (projecaoMes?.confianca === 'alta' || !mesCorrente)
        ? 'media'
        : ultimos12.length >= 6
          ? 'baixa'
          : 'insuficiente';

  return {
    central,
    faixaMin: projecaoMes?.faixaMin != null ? fechado + projecaoMes.faixaMin + estimadoRestantes * 0.85 : null,
    faixaMax: projecaoMes?.faixaMax != null ? fechado + projecaoMes.faixaMax + estimadoRestantes * 1.15 : null,
    confianca,
    fechado,
    metodo:
      `Meses fechados somados` +
      (mesCorrente ? `, mês em curso pela projeção de ritmo` : ``) +
      (restantes.length
        ? `, e ${restantes.length} ${restantes.length === 1 ? 'mês restante estimado' : 'meses restantes estimados'} pela ` +
          (sazonal === restantes.length ? `média do próprio mês nos anos anteriores.` : `média recente.`)
        : `.`),
  };
}

/* ======================== comparações ======================== */

const compararCom = (atual: number, base: number | null, parcial: boolean): Comparacao | null => {
  if (base == null) return null;
  return {
    base,
    delta: atual - base,
    pct: base !== 0 ? ((atual - base) / Math.abs(base)) * 100 : null,
    parcial,
  };
};

/** Soma de uma série diária até o dia `ate` de um mês específico. */
export const somaAteDia = (dias: readonly PontoDiario[], mesIso: string, ate: number): number =>
  dias.reduce((s, p) => {
    if (mesDe(p.dia) !== mesIso) return s;
    return Number(p.dia.slice(8, 10)) <= ate ? s + p.valor : s;
  }, 0);

/**
 * Todas as comparações do card, de uma vez.
 *
 * Mês FECHADO: compara valores cheios. Mês PARCIAL: mês anterior e mesmo mês
 * do ano anterior comparam até o MESMO dia (série diária); as médias 3/6/12
 * seguem sobre meses cheios — são régua de patamar, e o rótulo `parcial:
 * false` deixa o front dizer "média de meses completos".
 */
export function calcularComparacoes(args: {
  serieFechada: readonly PontoMensal[];
  mesRef: string;
  valorRef: number;
  parcial: boolean;
  diaAtual?: number;
  diasHistorico?: readonly PontoDiario[];
}): Comparacoes {
  const { serieFechada, mesRef, valorRef, parcial, diaAtual, diasHistorico } = args;
  const anteriores = serieFechada.filter((p) => p.mes < mesRef);
  const valorDe = (mes: string): number | null =>
    serieFechada.find((p) => p.mes === mes)?.valor ?? null;

  const mesAnterior = somarMeses(mesRef, -1);
  const mesmoMesAnoAnterior = somarMeses(mesRef, -12);

  let baseMesAnterior: number | null = valorDe(mesAnterior);
  let baseAnoAnterior: number | null = valorDe(mesmoMesAnoAnterior);
  let equivalente = false;

  if (parcial && diaAtual != null && diasHistorico?.length) {
    const tem = (mes: string) => diasHistorico.some((p) => mesDe(p.dia) === mes);
    if (tem(mesAnterior)) {
      baseMesAnterior = somaAteDia(diasHistorico, mesAnterior, diaAtual);
      equivalente = true;
    }
    if (tem(mesmoMesAnoAnterior)) {
      baseAnoAnterior = somaAteDia(diasHistorico, mesmoMesAnoAnterior, diaAtual);
    }
  }

  const mediaDe = (n: number): number | null => {
    const ultimos = anteriores.slice(-n);
    return ultimos.length === n ? media(ultimos.map((p) => p.valor)) : null;
  };

  let melhorMes: ReferenciaMes | null = null;
  let piorMes: ReferenciaMes | null = null;
  for (const p of anteriores) {
    if (!melhorMes || p.valor > melhorMes.valor) melhorMes = { mes: p.mes, valor: p.valor };
    if (!piorMes || p.valor < piorMes.valor) piorMes = { mes: p.mes, valor: p.valor };
  }

  return {
    mesAnterior: compararCom(valorRef, baseMesAnterior, parcial && equivalente),
    anoAnterior: compararCom(valorRef, baseAnoAnterior, parcial && equivalente),
    media3: compararCom(valorRef, mediaDe(3), false),
    media6: compararCom(valorRef, mediaDe(6), false),
    media12: compararCom(valorRef, mediaDe(12), false),
    melhorMes,
    piorMes,
  };
}

/* ==================== tendência e status ==================== */

/** Direção dos 3 últimos meses fechados; ±3% em torno da média = estável. */
export function tendenciaDe(serieFechada: readonly PontoMensal[]): Tendencia | null {
  const ultimos = serieFechada.slice(-3);
  if (ultimos.length < 3) return null;
  const [a, b, c] = ultimos.map((p) => p.valor);
  const base = Math.abs(media([a, b, c])) || 1;
  const sobe = b - a > base * 0.03 || c - b > base * 0.03;
  const cai = a - b > base * 0.03 || b - c > base * 0.03;
  if (c > b && b >= a) return 'subindo';
  if (c < b && b <= a) return 'caindo';
  if (!sobe && !cai) return 'estavel';
  return c >= a ? 'subindo' : 'caindo';
}

/**
 * Semáforo do card — nunca só cor: o rótulo vai junto (spec §6).
 *
 * A régua muda com o contexto:
 *   sem meta            -> neutro ("Sem meta definida"), informativo
 *   mês parcial c/ meta -> realizado vs ESPERADO até hoje (não vs meta cheia)
 *   mês fechado c/ meta -> realizado vs meta
 *   direção menor_melhor inverte a leitura (despesa acima do esperado = ruim)
 *   projeção abaixo da meta rebaixa verde para amarelo ("meta em risco")
 */
export function statusCard(args: {
  direcao: Direcao;
  meta: number | null;
  esperado: number | null;
  realizado: number | null;
  parcial: boolean;
  projecaoCentral: number | null;
  historicoMeses: number;
}): Status {
  const { direcao, meta, esperado, realizado, parcial, projecaoCentral, historicoMeses } = args;

  if (realizado == null) return { nivel: 'cinza', rotulo: 'Sem dados no período' };
  if (direcao === 'neutra') return { nivel: 'neutro', rotulo: 'Informativo' };
  if (meta == null) {
    return historicoMeses >= 2
      ? { nivel: 'neutro', rotulo: 'Sem meta definida' }
      : { nivel: 'cinza', rotulo: 'Histórico insuficiente' };
  }

  const referencia = parcial ? esperado : meta;
  if (referencia == null || referencia === 0) return { nivel: 'neutro', rotulo: 'Sem meta definida' };

  const razao = realizado / referencia;
  const r = direcao === 'menor_melhor' ? 2 - razao : razao; // espelha em torno de 1

  let nivel: NivelStatus;
  let rotulo: string;
  if (parcial) {
    if (r >= 0.97) {
      nivel = 'verde';
      rotulo = r >= 1.03 ? 'Acima do esperado' : 'Dentro do esperado';
    } else if (r >= 0.85) {
      nivel = 'amarelo';
      rotulo = 'Atenção';
    } else {
      nivel = 'vermelho';
      rotulo = direcao === 'menor_melhor' ? 'Acima do esperado' : 'Abaixo do esperado';
    }
    if (nivel === 'verde' && meta > 0 && projecaoCentral != null) {
      const rp = direcao === 'menor_melhor' ? 2 - projecaoCentral / meta : projecaoCentral / meta;
      if (rp < 0.95) {
        nivel = 'amarelo';
        rotulo = 'Meta em risco';
      }
    }
  } else {
    if (r >= 1) {
      nivel = 'verde';
      rotulo = 'Meta atingida';
    } else if (r >= 0.9) {
      nivel = 'amarelo';
      rotulo = 'Quase na meta';
    } else {
      nivel = 'vermelho';
      rotulo = direcao === 'menor_melhor' ? 'Estourou a meta' : 'Meta não atingida';
    }
  }
  return { nivel, rotulo };
}

/* ==================== consolidado anual ==================== */

export interface LinhaAnual {
  ano: number;
  total: number;
  mesesComDado: number;
  completo: boolean;
  mediaMensal: number;
  variacaoAnoAnterior: number | null;
  /** Contra o MESMO período (mesmos meses) do ano anterior. */
  variacaoPeriodoEquivalente: number | null;
  melhorMes: ReferenciaMes | null;
  piorMes: ReferenciaMes | null;
}

export function consolidadoAnual(
  serie: readonly PontoMensal[],
  anoCorrente: number,
): LinhaAnual[] {
  const porAno = new Map<number, PontoMensal[]>();
  for (const p of serie) {
    const ano = Number(p.mes.slice(0, 4));
    porAno.set(ano, [...(porAno.get(ano) ?? []), p]);
  }

  const linhas: LinhaAnual[] = [];
  const anos = [...porAno.keys()].sort();
  for (const ano of anos) {
    const meses = porAno.get(ano)!;
    const total = meses.reduce((s, p) => s + p.valor, 0);
    const anterior = porAno.get(ano - 1);

    let melhorMes: ReferenciaMes | null = null;
    let piorMes: ReferenciaMes | null = null;
    for (const p of meses) {
      if (!melhorMes || p.valor > melhorMes.valor) melhorMes = { mes: p.mes, valor: p.valor };
      if (!piorMes || p.valor < piorMes.valor) piorMes = { mes: p.mes, valor: p.valor };
    }

    const totalAnterior = anterior?.reduce((s, p) => s + p.valor, 0) ?? null;
    // Ano corrente contra ano fechado inteiro engana (docs/DESCOBERTAS.md §9);
    // a variação honesta usa os mesmos meses do ano anterior.
    const mesesDoAno = new Set(meses.map((p) => Number(p.mes.slice(5, 7))));
    const equivalenteAnterior = anterior
      ?.filter((p) => mesesDoAno.has(Number(p.mes.slice(5, 7))))
      .reduce((s, p) => s + p.valor, 0);

    linhas.push({
      ano,
      total,
      mesesComDado: meses.length,
      completo: ano < anoCorrente && meses.length === 12,
      mediaMensal: meses.length ? total / meses.length : 0,
      variacaoAnoAnterior:
        totalAnterior != null && totalAnterior !== 0
          ? ((total - totalAnterior) / Math.abs(totalAnterior)) * 100
          : null,
      variacaoPeriodoEquivalente:
        equivalenteAnterior != null && equivalenteAnterior !== 0
          ? ((total - equivalenteAnterior) / Math.abs(equivalenteAnterior)) * 100
          : null,
      melhorMes,
      piorMes,
    });
  }
  return linhas;
}

/* ==================== textos executivos ==================== */

const pctTexto = (pct: number | null): string =>
  pct == null ? '' : `${Math.abs(pct).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

/**
 * Frase executiva do card, montada de números já calculados (spec §20:
 * "gerados com base em regras verificáveis", nunca inventados por IA —
 * docs/DIVIDAS.md §10 tem a mesma regra).
 */
export function textoExecutivo(args: {
  nome: string;
  formatar: (v: number) => string;
  direcao: Direcao;
  realizado: number | null;
  esperado: number | null;
  meta: number | null;
  parcial: boolean;
  comparacoes: Comparacoes;
  projecao: Projecao | null;
}): string | null {
  const { nome, formatar, direcao, realizado, esperado, meta, parcial, comparacoes, projecao } = args;
  if (realizado == null) return null;
  const frases: string[] = [];
  const bom = (acima: boolean) => (direcao === 'menor_melhor' ? !acima : acima);

  if (parcial && esperado != null && esperado > 0) {
    const desvio = ((realizado - esperado) / esperado) * 100;
    if (Math.abs(desvio) < 3) {
      frases.push(`${nome} está em linha com o esperado para esta altura do mês.`);
    } else {
      frases.push(
        `${nome} está ${pctTexto(desvio)} ${realizado >= esperado ? 'acima' : 'abaixo'} do esperado para esta data` +
          `${bom(realizado >= esperado) ? '' : ' — merece atenção'}.`,
      );
    }
  } else if (!parcial && meta != null && meta > 0) {
    const pctMeta = (realizado / meta) * 100;
    frases.push(
      `${nome} fechou em ${formatar(realizado)}, ${pctMeta.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}% da meta.`,
    );
  }

  const cmp = comparacoes.mesAnterior;
  if (cmp && cmp.pct != null && Math.abs(cmp.pct) >= 1) {
    frases.push(
      `${cmp.delta >= 0 ? 'Alta' : 'Queda'} de ${pctTexto(cmp.pct)} sobre o ${cmp.parcial ? 'mesmo período do mês anterior' : 'mês anterior'}.`,
    );
  }

  if (parcial && projecao && meta != null && meta > 0) {
    const pctProj = (projecao.central / meta) * 100;
    const risco = direcao === 'menor_melhor' ? pctProj > 105 : pctProj < 95;
    if (risco) {
      frases.push(
        `Mantido o ritmo, a projeção fecha em ${formatar(projecao.central)} ` +
          `(${pctProj.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}% da meta).`,
      );
    }
  }

  return frases.length ? frases.join(' ') : null;
}
