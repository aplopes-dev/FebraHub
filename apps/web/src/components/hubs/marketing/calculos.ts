import { MESES, chaveMes, somaMeses, type ModoPeriodo } from "@/lib/dados";
import type { MarketingDesempenho, MarketingResumoMensal } from "@/types/views";

/* ============ MARKETING — recorte e agregação ============
   O que é REAL: investimento, leads e custo por lead — vêm do Meta Ads.
   O que NÃO existe: atribuição de venda a campanha. Sem ela não há venda
   atribuída, faturamento atribuído, ROI nem conversão — e estimar qualquer
   um deles seria inventar o número mais político do hub. */

export interface JanelaMkt {
  de: string;
  ate: string;
}

export interface RecorteMkt extends JanelaMkt {
  rotulo: string;
  rotuloAnt: string | null;
  ant: JanelaMkt | null;
  /** O filtro do topo pediu Hoje/7 dias — recorte que esta fonte não tem. */
  diario: boolean;
  geral?: boolean;
}

/* O Meta entrega gasto e leads agregados por MÊS — não existe linha diária.
   "7 dias" e "Hoje" não têm recorte possível nesta fonte: devolver vazio se
   leria como "não investimos nada", então o hub cai no mês corrente e diz
   por quê (`diario`). O comparativo é o período equivalente anterior: ano
   contra ano (mesmos meses), mês contra mês.

   `geral` = todos os anos. Não tem período anterior (é a base inteira), e
   por isso devolve `ant: null` — as variações somem em vez de comparar com
   um passado que não existe. */
export function recorteMkt(
  { modo, ano, mesIdx }: { modo: ModoPeriodo; ano: number; mesIdx: number },
  geral: boolean
): RecorteMkt {
  const h = new Date();
  const mesAtual = chaveMes(h.getFullYear(), h.getMonth());
  if (geral) {
    return {
      de: "0000-01", ate: mesAtual, rotulo: "Todos os anos",
      rotuloAnt: null, ant: null, diario: false, geral: true,
    };
  }
  if (modo === "ano") {
    const ate = `${ano}-12` > mesAtual ? mesAtual : `${ano}-12`;
    return {
      de: `${ano}-01`, ate, rotulo: String(ano), rotuloAnt: String(ano - 1), diario: false,
      ant: { de: `${ano - 1}-01`, ate: somaMeses(ate, -12) },
    };
  }
  const k = modo === "mes" ? chaveMes(ano, mesIdx) : mesAtual;
  const [ka, km] = [Number(k.slice(0, 4)), Number(k.slice(5, 7)) - 1];
  return {
    de: k, ate: k, rotulo: `${MESES[km]} ${ka}`, rotuloAnt: "mês anterior",
    diario: modo !== "mes",
    ant: { de: somaMeses(k, -1), ate: somaMeses(k, -1) },
  };
}

// Janela nula = "não existe período anterior" (modo Todos os anos): devolve
// vazio, e as variações somem em vez de comparar com um passado inventado.
export const noMesMkt = <T extends { mes?: string | null }>(
  linhas: readonly T[] | undefined,
  janela: JanelaMkt | null
): T[] =>
  !janela ? [] : (linhas ?? []).filter((r) => {
    const k = String(r.mes ?? "").slice(0, 7);
    return k !== "" && k >= janela.de && k <= janela.ate;
  });

/* Reduz as linhas por campanha ao MESMO formato da vw_marketing_resumo_mensal.
   Conferido linha a linha: investimento = Σ gasto, leads = Σ leads,
   gasto/leads de captação = Σ das campanhas de tipo "Captação". Por isso
   filtrar por produto não muda a fórmula de nenhum KPI — só o conjunto. */
export const mensalDeCampanhas = (linhas: readonly MarketingDesempenho[] | undefined): MarketingResumoMensal[] => {
  const m = new Map<string, {
    mes: string; investimento: number; leads: number; gasto_captacao: number; leads_captacao: number;
  }>();
  for (const l of linhas ?? []) {
    const k = String(l.mes ?? "").slice(0, 10);
    if (!k) continue;
    const a = m.get(k) ?? { mes: k, investimento: 0, leads: 0, gasto_captacao: 0, leads_captacao: 0 };
    a.investimento += Number(l.gasto ?? 0);
    a.leads += Number(l.leads ?? 0);
    if (/capta/i.test(l.tipo ?? "")) {
      a.gasto_captacao += Number(l.gasto ?? 0);
      a.leads_captacao += Number(l.leads ?? 0);
    }
    m.set(k, a);
  }
  return [...m.values()].sort((a, b) => a.mes.localeCompare(b.mes));
};

export interface TotaisMkt {
  investimento: number;
  leads: number;
  gastoCapt: number;
  leadsCapt: number;
  mesesSemLead: number;
  cpl: number | null;
  pctCapt: number | null;
}

/* CPL nunca é média de médias: é Σ gasto de captação ÷ Σ leads de captação.
   Só campanha de captação gera lead — dividir pelo investimento TOTAL daria
   um custo por lead inflado, e a cobertura (`pctCapt`) mostra a diferença. */
export const totaisMkt = (linhas: readonly MarketingResumoMensal[]): TotaisMkt => {
  const t = { investimento: 0, leads: 0, gastoCapt: 0, leadsCapt: 0, mesesSemLead: 0 };
  for (const r of linhas) {
    const inv = Number(r.investimento ?? 0);
    t.investimento += inv;
    t.leads += Number(r.leads ?? 0);
    t.gastoCapt += Number(r.gasto_captacao ?? 0);
    t.leadsCapt += Number(r.leads_captacao ?? 0);
    if (inv > 0 && !Number(r.leads ?? 0)) t.mesesSemLead += 1;
  }
  return {
    ...t,
    cpl: t.leadsCapt ? t.gastoCapt / t.leadsCapt : null,
    pctCapt: t.investimento ? (t.gastoCapt / t.investimento) * 100 : null,
  };
};

export const varMkt = (a: number, b: number): number | null => (b ? ((a - b) / Math.abs(b)) * 100 : null);
export const rotuloVar = (p: number | null): string | null => (p == null ? null : `${Math.abs(p).toFixed(0)}%`);

/* Categorias da vw_marketing_desempenho. A ordem é fixa (as duas que geram
   lead primeiro), mas a LISTA vem do dado — categoria nova no banco aparece
   sozinha, sem passar por aqui. */
export const ORDEM_CAT_MKT = ["CIS", "GGB", "LL", "Eventos", "Outros"];

export const ROTULO_SEM_CAMPANHA = "anúncio — campanha não identificada";
