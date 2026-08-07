"use client";

import { useMemo } from "react";
import {
  useComercialRankingHistorico, useFinanceiroDespesaCategoriaPeriodo,
  useFinanceiroReceitaCategoriaPeriodo, useLojaReceitaPeriodo, useLojaSerie,
} from "./hubs";
import { CAT_GERAL, CAT_SEM_BOTAO, CAT_SYMPLA, ORDEM_CAT, chaveMes } from "@/lib/dados";

/* Lista de categorias derivada do dado + Sympla (que vive noutra view). */
export function useCategoriasDisponiveis(): string[] {
  const r = useComercialRankingHistorico();
  return useMemo(() => {
    const set = new Set<string>();
    for (const x of r.data ?? []) if (x.categoria && !CAT_SEM_BOTAO(x.categoria)) set.add(String(x.categoria));
    const ord = (c: string) => { const i = ORDEM_CAT.indexOf(c); return i < 0 ? 99 : i; };
    // Geral primeiro (padrão), depois as formações + Mentoria, Sympla por último.
    return [CAT_GERAL, ...[...set].sort((a, b) => ord(a) - ord(b) || a.localeCompare(b)), CAT_SYMPLA];
  }, [r.data]);
}

export interface RangeDatas {
  minMes: string;
  maxMes: string;
  anos: number[];
}

/* Limites de navegação saem do DADO, não do calendário: o primeiro mês com
   movimento (união das views _periodo) até o mês atual. Nada de 2024/2026
   chumbado — se a base crescer pra trás, a navegação cresce junto. */
export function useRangeDatas(): RangeDatas {
  const a = useFinanceiroReceitaCategoriaPeriodo();
  const b = useFinanceiroDespesaCategoriaPeriodo();
  const c = useLojaReceitaPeriodo();
  // A loja (gestora, sem acesso ao financeiro) não enxerga as views
  // financeiras, então os anos dela saíam só de `c`, que traz só 2026. A
  // série longa da loja cobre 2022-2026, então entra como fonte dos anos (e
  // do minMes). Cada view usa sua coluna de data: `data` nas _periodo, `mes`
  // na série. Para quem não é da loja ela vem vazia, sem efeito nos outros hubs.
  const d = useLojaSerie();
  return useMemo(() => {
    const h = new Date();
    const maxMes = chaveMes(h.getFullYear(), h.getMonth());
    let min: string | null = null;
    const anos = new Set<number>();
    const somar = (src: readonly unknown[] | undefined, campo: string) => {
      for (const r of src ?? []) {
        const dt = String((r as Record<string, unknown>)[campo] ?? "").slice(0, 10);
        if (!dt) continue;
        if (!min || dt < min) min = dt;
        anos.add(Number(dt.slice(0, 4)));
      }
    };
    for (const src of [a.data, b.data, c.data]) somar(src, "data");
    somar(d.data, "mes");
    const minMes = min ? String(min).slice(0, 7) : maxMes;
    const lista = anos.size ? [...anos].sort((x, y) => y - x) : [h.getFullYear()];
    return { minMes, maxMes: maxMes < minMes ? minMes : maxMes, anos: lista };
  }, [a.data, b.data, c.data, d.data]);
}
