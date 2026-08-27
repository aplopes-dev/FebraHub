import type { StockTransferListParams } from "@/features/stock-transfers/types/stock-transfer";

export const stockTransferKeys = {
  all: (scope: string) => ["api", "stock-transfers", scope] as const,
  lists: (scope: string) => [...stockTransferKeys.all(scope), "list"] as const,
  list: (scope: string, params: StockTransferListParams) =>
    [...stockTransferKeys.lists(scope), params] as const,
};
