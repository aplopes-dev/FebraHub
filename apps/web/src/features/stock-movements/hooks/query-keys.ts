import type { StockMovementListParams } from "@/features/stock-movements/types/stock-movement";
import type { StockBalanceListParams } from "@/features/stock-movements/api/stock-movements.service";

export const stockMovementKeys = {
  all: (scope: string) => ["api", "stock-movements", scope] as const,
  lists: (scope: string) => [...stockMovementKeys.all(scope), "list"] as const,
  list: (scope: string, params: StockMovementListParams) =>
    [...stockMovementKeys.lists(scope), params] as const,
  detail: (scope: string, id: string) =>
    [...stockMovementKeys.all(scope), "detail", id] as const,
  categoryOptions: (scope: string, type: string) =>
    [...stockMovementKeys.all(scope), "category-options", type] as const,
};

export const stockBalanceKeys = {
  all: (scope: string) => ["api", "stock-balance", scope] as const,
  lists: (scope: string) => [...stockBalanceKeys.all(scope), "list"] as const,
  list: (scope: string, params: StockBalanceListParams) =>
    [...stockBalanceKeys.lists(scope), params] as const,
  productMovements: (scope: string, stockId: string, productId: string) =>
    [...stockBalanceKeys.all(scope), "product-movements", stockId, productId] as const,
  /** Balanço completo (todas as páginas) de um depósito — ver inventário. */
  full: (scope: string, stockId: string) =>
    [...stockBalanceKeys.all(scope), "full", stockId] as const,
};
