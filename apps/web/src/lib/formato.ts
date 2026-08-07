/* ============================================================
   AGREGAÇÃO E FORMATAÇÃO — as views vêm agrupadas por mês.
   O KPI compara o último mês fechado com o anterior.
   ============================================================ */

export interface PontoMes {
  mes: string;
  valor: number;
}

const col = (o: unknown, k: string): unknown => (o as Record<string, unknown>)[k];

export function porMes<T>(linhas: readonly T[], campoMes = "mes", campoValor = "valor"): PontoMes[] {
  const mapa = new Map<string, number>();
  for (const l of linhas) {
    if (!col(l, campoMes)) continue; // linhas sem data ficam fora do gráfico — e aparecem no card de qualidade
    const k = String(col(l, campoMes));
    mapa.set(k, (mapa.get(k) ?? 0) + Number(col(l, campoValor) ?? 0));
  }
  return [...mapa.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([mes, valor]) => ({ mes, valor }));
}

/* O mês corrente está incompleto. Comparar 14 dias de julho contra
   junho inteiro produz "-99%" — um número tecnicamente correto e
   completamente enganoso. O KPI usa o último mês FECHADO; o mês em
   curso aparece à parte, rotulado como parcial. */
const mesCorrente = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

export interface Variacao {
  atual: number;
  delta: string | null;
  up: boolean;
  parcial: number | null;
  mes?: string;
  serie?: PontoMes[];
}

export function variacao(serie: readonly PontoMes[]): Variacao {
  const corrente = mesCorrente();
  const fechados = serie.filter((s) => s.mes < corrente);
  const parcial = serie.find((s) => s.mes === corrente) ?? null;

  if (!fechados.length)
    return { atual: parcial?.valor ?? 0, delta: null, up: true, parcial: null, mes: parcial?.mes };

  const atual = fechados[fechados.length - 1].valor;
  const anterior = fechados[fechados.length - 2]?.valor;

  const base = {
    atual,
    mes: fechados[fechados.length - 1].mes,
    parcial: parcial ? parcial.valor : null,
    serie: [...fechados],
  };

  if (!anterior) return { ...base, delta: null, up: true };

  const pct = ((atual - anterior) / Math.abs(anterior)) * 100;
  return { ...base, delta: `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%`, up: pct >= 0 };
}

export const moeda = (v: number | null | undefined): string =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: Math.abs(v as number) >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(v ?? 0);

export const numero = (v: number | null | undefined): string =>
  new Intl.NumberFormat("pt-BR").format(v ?? 0);

export const rotuloMes = (iso: string | null | undefined): string =>
  iso
    ? new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")
    : "—";

// Reais com centavos. O `moeda` global compacta e arredonda pra 1 casa —
// bom pra R$ 415 mil, péssimo pra um CPL de R$ 2,01 (viraria "R$ 2").
export const reaisCent = (v: number | null | undefined): string =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v ?? 0);

// Rótulo curto de barra: "2,1 mi" / "550 mil" — adapta à ordem de grandeza.
export const compacto = (v: number | null | undefined): string =>
  new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(v ?? 0);

export const mesCurto = (ym: string): string => {
  const d = new Date(ym + "-01T00:00:00");
  const s = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/* Taxa vinda da view pode chegar como fração (0.55) ou percentual (55). O
   perfil sem acesso não vê o valor real (o recorte zera), então não dá pra
   fixar a escala — normalizo pros dois formatos: <= 1.5 é fração e vira 0–100. */
export const pctTaxa = (v: number | null | undefined): number => {
  const n = Number(v ?? 0);
  return n <= 1.5 ? n * 100 : n;
};

export const fmtPct = (v: number | null | undefined, casas = 0): string =>
  v == null
    ? "—"
    : `${pctTaxa(v).toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas })}%`;

export const nota1 = (v: number | null | undefined): string =>
  v == null ? "—" : Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
