"use client";

import { useMemo, useState } from "react";
import { computeEntryTotal } from "@/features/financial-entries/lib/financial-entry-form-values";
import type { FinancialEntry } from "@/features/financial-entries/types/financial-entry";
import type { FinancialStatementFilters } from "@/features/financial-statement/types/financial-statement";

/**
 * Seleção de linhas com soma (US3, FR-011) — 100% client-side sobre as
 * linhas já carregadas na página atual, sem chamada de API extra
 * (`data-model.md` § `FinancialStatementSelection`). Reseta sempre que
 * filtro, eixo de data, busca ou página mudam — edge case do spec ("trocar
 * de página ou filtro limpa a seleção").
 */
export function useFinancialStatementSelection(
  entries: FinancialEntry[],
  filters: FinancialStatementFilters,
  search: string,
  page: number,
) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Reset da seleção quando filtro/eixo/busca/página mudam — ajuste de
  // estado durante o render (não um efeito): evita o re-render extra de um
  // `useEffect` e é o padrão recomendado para "resetar estado quando uma
  // prop muda" (react.dev/learn/you-might-not-need-an-effect).
  const [prevFilters, setPrevFilters] = useState(filters);
  const [prevSearch, setPrevSearch] = useState(search);
  const [prevPage, setPrevPage] = useState(page);
  if (filters !== prevFilters || search !== prevSearch || page !== prevPage) {
    setPrevFilters(filters);
    setPrevSearch(search);
    setPrevPage(page);
    setSelectedIds(new Set());
  }

  function toggle(id: string): void {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function clear(): void {
    setSelectedIds(new Set());
  }

  const totals = useMemo(() => {
    let count = 0;
    let netCents = 0;
    for (const entry of entries) {
      if (!selectedIds.has(entry.id)) continue;
      count += 1;
      const amountCents = Math.round(computeEntryTotal(entry) * 100);
      netCents += entry.operation === "payable" ? -amountCents : amountCents;
    }
    return { count, netCents };
  }, [entries, selectedIds]);

  return { selectedIds, toggle, clear, totals };
}
