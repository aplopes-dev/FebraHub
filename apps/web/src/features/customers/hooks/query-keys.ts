import type { CustomerListParams } from "@/features/customers/types/customer";

/**
 * Chaves de cache dos clientes. Toda chave começa pelo `scope`
 * (empresa + unidade ativa) para isolar o cache ao trocar de contexto.
 */
export const customerKeys = {
  all: (scope: string) => ["api", "customers", scope] as const,
  lists: (scope: string) => [...customerKeys.all(scope), "list"] as const,
  list: (scope: string, params: CustomerListParams) =>
    [...customerKeys.lists(scope), params] as const,
  detail: (scope: string, id: string) =>
    [...customerKeys.all(scope), "detail", id] as const,
  active: (scope: string) => [...customerKeys.all(scope), "active"] as const,
};

export const customerCategoryKeys = {
  all: (scope: string) =>
    ["api", "customer-categories", scope] as const,
  lists: (scope: string) =>
    [...customerCategoryKeys.all(scope), "list"] as const,
  list: (
    scope: string,
    params: { search: string; page: number; perPage: number },
  ) => [...customerCategoryKeys.lists(scope), params] as const,
  allItems: (scope: string) =>
    [...customerCategoryKeys.all(scope), "all"] as const,
};
