import { moeda } from "@/lib/formato";
import type { LojaMetaMes, LojaProdutoVendidoMes } from "@/types/views";

/* ============ LOJA · PRODUTOS E ESTOQUE (Omie PDV) ============
   Mesma fonte da parte financeira agora: tudo no Hub Loja vem do Omie
   (cupom fiscal do PDV). Estes helpers cuidam da visão de PRODUTO — ranking
   de vendidos e posição de estoque —, complementar à de receita/formas. */

export interface ProdutoVendido {
  produto: string;
  quantidade: number;
  faturamento: number;
}

// Uma linha por (produto, mês). Soma os meses do recorte e devolve o top-N
// por faturamento. Mês entra se seu ANO-MÊS cruza o período (dado mensal não
// tem dia; recortar por dia zeraria a loja em quase todo filtro).
export const produtosNoPeriodo = (
  linhas: readonly LojaProdutoVendidoMes[] | undefined,
  inicio: string,
  fim: string,
  topN = 10
): ProdutoVendido[] => {
  const de = String(inicio).slice(0, 7), ate = String(fim).slice(0, 7);
  const m = new Map<string, ProdutoVendido>();
  for (const l of linhas ?? []) {
    const ym = String(l.mes ?? "").slice(0, 7);
    if (!ym || ym < de || ym > ate) continue;
    const k = String(l.produto_id ?? l.produto ?? "—");
    const a = m.get(k) ?? { produto: String(l.produto ?? "—"), quantidade: 0, faturamento: 0 };
    a.quantidade += Number(l.quantidade ?? 0);
    a.faturamento += Number(l.faturamento ?? 0);
    m.set(k, a);
  }
  return [...m.values()].sort((a, b) => b.faturamento - a.faturamento).slice(0, topN);
};

/* Frase da meta. A vw_loja_receita_total_mes traz o nível e os patamares
   (min/básica/máster) sobre o consolidado, mas não a frase pronta — então é
   montada aqui, nas mesmas quatro variações da planilha da gestora. */
export function resumoMeta(m: LojaMetaMes): string {
  const r = Number(m.receita ?? 0);
  const min = Number(m.meta_minima ?? 0), bas = Number(m.meta_basica ?? 0), mas = Number(m.meta_master ?? 0);
  const nivel = String(m.nivel_atingido ?? "").trim().toLowerCase();
  if (nivel.startsWith("máster") || nivel.startsWith("master")) return `Meta máster batida · superou em ${moeda(r - mas)}`;
  if (nivel.startsWith("bás") || nivel.startsWith("bas")) return `Meta básica batida · faltam ${moeda(mas - r)} para a máster`;
  if (nivel.startsWith("mín") || nivel.startsWith("min")) return `Meta mínima batida · faltam ${moeda(bas - r)} para a básica`;
  if (nivel.startsWith("abaixo")) return `Abaixo da mínima · faltam ${moeda(min - r)}`;
  return "Sem meta cadastrada";
}
