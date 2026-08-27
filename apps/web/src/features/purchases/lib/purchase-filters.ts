import type { PurchaseListFilters } from "@/features/purchases/types/purchase";

export function createEmptyPurchaseFilters(): PurchaseListFilters {
  return {
    warehouseId: null,
    supplierId: null,
    dateFrom: null,
    dateTo: null,
  };
}

export function countActivePurchaseFilters(
  filters: PurchaseListFilters,
): number {
  let count = 0;
  if (filters.warehouseId) count += 1;
  if (filters.supplierId) count += 1;
  if (filters.dateFrom) count += 1;
  if (filters.dateTo) count += 1;
  return count;
}
