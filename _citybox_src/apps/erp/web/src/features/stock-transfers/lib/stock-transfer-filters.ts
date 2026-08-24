import type { StockTransferListFilters } from "@/features/stock-transfers/types/stock-transfer";

export function createEmptyStockTransferFilters(): StockTransferListFilters {
  return {
    fromWarehouseId: null,
    toWarehouseId: null,
  };
}

export function countActiveStockTransferFilters(
  filters: StockTransferListFilters,
): number {
  let count = 0;
  if (filters.fromWarehouseId) count += 1;
  if (filters.toWarehouseId) count += 1;
  return count;
}
