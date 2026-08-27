/* ============================================================
   HELPERS DE RECORTE E AGREGAÇÃO

   Regras de negócio que o front aplica sobre o que a API devolve. Nenhuma
   delas inventa dado: recortam, somam e rotulam.
   ============================================================ */

export interface LinhaRotulada {
  rotulo: string;
  valor: number;
  orfa?: boolean;
}

/** Acesso a coluna por nome. As linhas vêm da API com interfaces declaradas
 *  (sem index signature), e os helpers abaixo são genéricos por coluna — daí
 *  a leitura dinâmica ficar concentrada aqui, num lugar só. */
const col = (o: unknown, k: string): unknown => (o as Record<string, unknown>)[k];

export const agrupar = <T>(linhas: readonly T[], chave: string, valor: string): LinhaRotulada[] => {
  const m = new Map<string, number>();
  for (const l of linhas) {
    const k = String(col(l, chave) ?? "—");
    m.set(k, (m.get(k) ?? 0) + Number(col(l, valor) ?? 0));
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([rotulo, v]) => ({ rotulo, valor: v }));
};

// "Sem vínculo" não é categoria de produto: é pagamento que entrou sem
// matrícula casada. Nunca disputa o topo do ranking como se fosse curso.
export const ehSemVinculo = (cat: unknown): boolean =>
  /sem[\s_]?v[ií]nculo|n[aã]o[_\s]?determinad|indefinid/i.test(String(cat ?? ""));

/* ============ PERÍODO GLOBAL ============
   Recorta só métricas de FLUXO (receita/despesa por categoria, receita da
   loja) pela coluna `data`. Métricas de ESTADO — inadimplência, a receber
   e a pagar por horizonte, status de pagamento — são snapshot do agora e
   ignoram o filtro. As linhas de evolução mostram a série inteira sempre. */
export type ModoPeriodo = "ano" | "mes" | "7d" | "hoje";

export const PERIODOS: readonly { key: ModoPeriodo; label: string }[] = [
  { key: "ano", label: "Ano" },
  { key: "mes", label: "Mês" },
  { key: "7d", label: "7 dias" },
  { key: "hoje", label: "Hoje" },
];

export const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export const iso = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const chaveMes = (a: number, m: number): string => `${a}-${String(m + 1).padStart(2, "0")}`;

export interface Intervalo {
  inicio: string;
  fim: string;
  rotulo: string;
}

/* O recorte é ancorado em (ano, mês) escolhidos, não no "hoje" fixo.
   `fim` nunca passa de hoje — mês/ano futuro não inventa dia que não veio. */
export function intervaloDe({ modo, ano, mesIdx }: { modo: ModoPeriodo; ano: number; mesIdx: number }): Intervalo {
  const h = new Date();
  const hoje = iso(new Date(h.getFullYear(), h.getMonth(), h.getDate()));
  const menor = (a: string, b: string) => (a < b ? a : b);
  if (modo === "mes") {
    return {
      inicio: iso(new Date(ano, mesIdx, 1)),
      fim: menor(iso(new Date(ano, mesIdx + 1, 0)), hoje), // dia 0 = último do mês
      rotulo: `${MESES[mesIdx]} ${ano}`,
    };
  }
  if (modo === "7d") {
    const f = new Date(h.getFullYear(), h.getMonth(), h.getDate());
    return {
      inicio: iso(new Date(f.getFullYear(), f.getMonth(), f.getDate() - 6)),
      fim: hoje,
      rotulo: "Últimos 7 dias",
    };
  }
  if (modo === "hoje") {
    return { inicio: hoje, fim: hoje, rotulo: "Hoje" };
  }
  return { inicio: iso(new Date(ano, 0, 1)), fim: menor(iso(new Date(ano, 11, 31)), hoje), rotulo: String(ano) };
}

/* ============ CATEGORIA (só Hub Comercial) ============
   Cada categoria é uma UNIDADE DE NEGÓCIO separada: o filtro recorta os
   painéis pra uma delas, e não existe opção "todas" de propósito — somar
   faturamento de categorias diferentes num total único não significa nada.
   Os valores de `categoria` saem da própria view (não chumbados aqui);
   só os rótulos feios ganham um nome apresentável. */
export const CAT_SYMPLA = "Sympla";
export const CAT_GERAL = "Geral"; // consolidado GGB + CI + CIS (padrão); Sympla fica fora
export const ROTULO_CAT: Record<string, string> = { CI: "Coach Individual", "Coaching Individual": "Coach Individual" };
export const rotuloCat = (c: string): string => ROTULO_CAT[c] ?? c;
export const ORDEM_CAT = ["GGB", "CIS", "CI", "Coaching Individual", "Mentoria"];
// Categorias que somam no Geral (backend) mas não viram botão próprio: "Sem
// categoria" é bucket de qualidade, "Evento" já aparece via Sympla, e
// "Franquia"/"Outro" foram tirados da barra a pedido. Só oculta o botão —
// os dados e o total do Geral seguem intactos.
export const CAT_SEM_BOTAO = (c: unknown): boolean =>
  /sem[\s_]?categoria|^\s*evento\s*$|^\s*franquia\s*$|^\s*outros?\s*$|indefinid|n[aã]o[_\s]?determinad/i.test(
    String(c ?? "")
  );

// Título de vazio de fluxo, ciente do "Hoje" (que vem vazio com frequência).
export const tituloVazioFluxo = (modo: ModoPeriodo): string =>
  modo === "hoje" ? "Sem movimentação hoje" : "Nenhuma movimentação no período";

// Recorte de fluxo pela coluna de data. ISO compara como string.
// `campo` varia por view: as _periodo usam `data`; as carinhas, `data_pagamento`.
export const noPeriodo = <T>(
  linhas: readonly T[] | undefined,
  { inicio, fim }: { inicio: string; fim: string },
  campo = "data"
): T[] =>
  (linhas ?? []).filter((r) => {
    const d = String(col(r, campo) ?? "").slice(0, 10);
    return d !== "" && d >= inicio && d <= fim;
  });

export type LinhaSomada = Record<string, string | number>;

// Reagrega as linhas do período somando `campos` por `chave`.
export const somarPor = <T>(
  linhas: readonly T[],
  chave: string,
  campos: readonly string[]
): LinhaSomada[] => {
  const m = new Map<string, LinhaSomada>();
  for (const l of linhas) {
    const k = String(col(l, chave) ?? "—");
    const a: LinhaSomada = m.get(k) ?? { [chave]: k, ...Object.fromEntries(campos.map((c) => [c, 0])) };
    for (const c of campos) a[c] = Number(a[c] ?? 0) + Number(col(l, c) ?? 0);
    m.set(k, a);
  }
  return [...m.values()];
};

export interface PontoSerie {
  mes: string;
  valor: number;
  parcial: boolean;
  /** Fonte provisória (planilha) — sai tracejado no gráfico. */
  provisorio?: boolean;
}

// Série mensal padrão: {mes, valor, parcial}. O mês corrente tem só alguns
// dias — fica marcado como parcial pra sair tracejado e fora do domínio Y.
export const serieMensal = <T>(linhas: readonly T[] | undefined, campo: string): PontoSerie[] => {
  const d = new Date();
  const cm = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  return (linhas ?? [])
    .map((r) => ({ mes: String(col(r, "mes") ?? ""), valor: Number(col(r, campo) ?? 0) }))
    .filter((r) => r.mes)
    .sort((a, b) => a.mes.localeCompare(b.mes))
    .map((r) => ({ ...r, parcial: r.mes.slice(0, 10) === cm }));
};

export interface LinhaHorizonte {
  ord: string;
  rotulo: string;
  valor: number;
  parcelas: number;
}

// Horizonte vem rotulado "1 · até 30 dias": ordeno pelo prefixo numérico e
// só mostro o texto. É linha do tempo (30/60/90), não ranking por valor.
export const porHorizonte = <T>(linhas: readonly T[] | undefined, campo: string): LinhaHorizonte[] =>
  (linhas ?? [])
    .map((r) => ({
      ord: String(col(r, "horizonte") ?? ""),
      rotulo: String(col(r, "horizonte") ?? "—").replace(/^\s*\d+\s*·\s*/, ""),
      valor: Number(col(r, campo) ?? 0),
      parcelas: Number(col(r, "parcelas") ?? 0),
    }))
    .sort((a, b) => a.ord.localeCompare(b.ord));

// Número BR tolerante: "5.000.000,50" | "5000000" | "R$ 5.000" -> número.
export const parseBRNumero = (v: unknown): number | null => {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const limpo = s.replace(/[^\d.,]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  const n = Number(limpo);
  return Number.isFinite(n) ? n : null;
};

export const dataCurta = (d: unknown): string => {
  if (!d) return "—";
  const [a, m] = String(d).slice(0, 10).split("-");
  return m ? `${MESES[Number(m) - 1].slice(0, 3).toLowerCase()}/${a.slice(2)}` : "—";
};

export const dataDDMM = (d: unknown): string => {
  if (!d) return "—";
  const p = String(d).slice(0, 10).split("-");
  return p[2] && p[1] ? `${p[2]}/${p[1]}` : "—";
};

export const emNDias = (n: number | null | undefined): string => {
  if (n == null) return "—";
  const v = Number(n);
  return v === 0 ? "hoje" : v < 0 ? `há ${-v} dias` : `em ${v} dias`;
};

/* Rótulo de trimestre defensivo: `periodo` pode vir "2024-Q3", "2024-T3",
   "2024-3" ou "2024-07" (mês). YYYY-MM vira o trimestre do mês; o resto usa o
   dígito 1–4 do fim. Sem casar, mostra o texto cru — nunca inventa. */
export const rotuloTri = (p: unknown): string => {
  const s = String(p ?? "").trim();
  const mm = s.match(/^(\d{4})-(\d{2})$/);
  if (mm) return `T${Math.floor((Number(mm[2]) - 1) / 3) + 1}/${mm[1].slice(2)}`;
  const q = s.match(/(\d{4}).*?([1-4])\s*$/);
  if (q) return `T${q[2]}/${q[1].slice(2)}`;
  return s || "—";
};

export const somaMeses = (k: string, d: number): string => {
  let a = Number(k.slice(0, 4));
  let m = Number(k.slice(5, 7)) - 1 + d;
  a += Math.floor(m / 12);
  m = ((m % 12) + 12) % 12;
  return chaveMes(a, m);
};
