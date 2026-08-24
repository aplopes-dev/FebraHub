import type { ProductionOrderListParams } from "@/features/production/types/production";

/**
 * Chaves de cache do módulo de produção. Toda chave começa pelo `scope`
 * (empresa + unidade ativa) para que trocar de uma ou de outra isole o cache
 * automaticamente — sem isso, a tela mostraria dados da anterior.
 */
export const productionKeys = {
  all: (scope: string) => ["comercio", "production-orders", scope] as const,
  lists: (scope: string) => [...productionKeys.all(scope), "list"] as const,
  list: (scope: string, params: ProductionOrderListParams) =>
    [...productionKeys.lists(scope), params] as const,
  detail: (scope: string, id: string) =>
    [...productionKeys.all(scope), "detail", id] as const,
  history: (scope: string, id: string) =>
    [...productionKeys.all(scope), "history", id] as const,
};
