import type { CarrierListParams } from "@/features/carriers/types/carrier";

/**
 * Chaves de cache das transportadoras. Toda chave começa pelo `scope`
 * (empresa + unidade ativa) para que trocar de uma ou de outra isole o cache
 * automaticamente — sem isso, a tela mostraria dados da anterior.
 */
export const carrierKeys = {
  all: (scope: string) => ["comercio", "carriers", scope] as const,
  lists: (scope: string) => [...carrierKeys.all(scope), "list"] as const,
  list: (scope: string, params: CarrierListParams) =>
    [...carrierKeys.lists(scope), params] as const,
  detail: (scope: string, id: string) =>
    [...carrierKeys.all(scope), "detail", id] as const,
  options: (scope: string) => [...carrierKeys.all(scope), "options"] as const,
};
