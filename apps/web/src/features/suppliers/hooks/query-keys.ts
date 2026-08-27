import type { SupplierListParams } from "@/features/suppliers/types/supplier";

/**
 * Chaves de cache dos fornecedores. Toda chave começa pelo `scope`
 * (empresa + unidade ativa) para que trocar de uma ou de outra isole o cache
 * automaticamente — sem isso, a tela mostraria dados da anterior.
 */
export const supplierKeys = {
  all: (scope: string) => ["api", "suppliers", scope] as const,
  lists: (scope: string) => [...supplierKeys.all(scope), "list"] as const,
  list: (scope: string, params: SupplierListParams) =>
    [...supplierKeys.lists(scope), params] as const,
  detail: (scope: string, id: string) =>
    [...supplierKeys.all(scope), "detail", id] as const,
  active: (scope: string) => [...supplierKeys.all(scope), "active"] as const,
};
