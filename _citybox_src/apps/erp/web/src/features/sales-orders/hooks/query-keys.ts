import type { SaleOrderListParams } from "@/features/sales-orders/types/sale-order";

export const saleOrderKeys = {
  all: (scope: string) => ["comercio", "sale-orders", scope] as const,
  lists: (scope: string) => [...saleOrderKeys.all(scope), "list"] as const,
  list: (scope: string, params: SaleOrderListParams) =>
    [...saleOrderKeys.lists(scope), params] as const,
  detail: (scope: string, id: string) =>
    [...saleOrderKeys.all(scope), "detail", id] as const,
  sellers: (scope: string) => [...saleOrderKeys.all(scope), "sellers"] as const,
};
