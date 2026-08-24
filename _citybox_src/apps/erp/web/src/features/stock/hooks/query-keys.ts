import type { StockListParams } from "@/features/stock/types/stock";

export const stockKeys = {
  all: (scope: string) => ["comercio", "stocks", scope] as const,
  lists: (scope: string) => [...stockKeys.all(scope), "list"] as const,
  list: (scope: string, params: StockListParams) =>
    [...stockKeys.lists(scope), params] as const,
  detail: (scope: string, id: string) =>
    [...stockKeys.all(scope), "detail", id] as const,
  /** Todos os depósitos (paginação percorrida) — selects, não listagem. */
  allItems: (scope: string) => [...stockKeys.all(scope), "all-items"] as const,
};
