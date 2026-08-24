import type { ProductListParams } from "@/features/products/types/product";

/**
 * Chaves de cache do módulo de produtos. Toda chave começa pelo `scope`
 * (empresa + unidade ativa) para que trocar de uma ou de outra isole o cache
 * automaticamente — sem isso, a tela mostraria dados da anterior.
 */
export const productKeys = {
  all: (scope: string) => ["comercio", "products", scope] as const,
  lists: (scope: string) => [...productKeys.all(scope), "list"] as const,
  list: (scope: string, params: ProductListParams) =>
    [...productKeys.lists(scope), params] as const,
  catalogAll: (scope: string) =>
    [...productKeys.all(scope), "catalog-all"] as const,
  detail: (scope: string, id: string) =>
    [...productKeys.all(scope), "detail", id] as const,
  categories: (scope: string) =>
    [...productKeys.all(scope), "categories"] as const,
  units: (scope: string) => [...productKeys.all(scope), "units"] as const,
  addons: (scope: string) => [...productKeys.all(scope), "addons"] as const,
};
