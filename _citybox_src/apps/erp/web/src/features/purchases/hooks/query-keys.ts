import type { PurchaseListParams } from "@/features/purchases/types/purchase";

/**
 * Chaves de cache do módulo de compras. Toda chave começa pelo `scope`
 * (empresa + unidade ativa) para que trocar de uma ou de outra isole o cache
 * automaticamente — sem isso, a tela mostraria dados da anterior.
 */
export const purchaseKeys = {
  all: (scope: string) => ["comercio", "purchases", scope] as const,
  lists: (scope: string) => [...purchaseKeys.all(scope), "list"] as const,
  list: (scope: string, params: PurchaseListParams) =>
    [...purchaseKeys.lists(scope), params] as const,
  detail: (scope: string, id: string) =>
    [...purchaseKeys.all(scope), "detail", id] as const,
};
