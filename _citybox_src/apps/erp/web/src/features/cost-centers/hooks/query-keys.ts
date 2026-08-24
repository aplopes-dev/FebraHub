import type { CostCenterListParams } from "@/features/cost-centers/types/cost-center";

/**
 * Chaves de cache dos centros de custo. Toda chave começa pelo `scope`
 * (empresa + unidade ativa) para que trocar de uma ou de outra isole o cache.
 */
export const costCenterKeys = {
  all: (scope: string) => ["comercio", "cost-centers", scope] as const,
  lists: (scope: string) => [...costCenterKeys.all(scope), "list"] as const,
  list: (scope: string, params: CostCenterListParams) =>
    [...costCenterKeys.lists(scope), params] as const,
  detail: (scope: string, id: string) =>
    [...costCenterKeys.all(scope), "detail", id] as const,
  options: (scope: string) => [...costCenterKeys.all(scope), "options"] as const,
};
