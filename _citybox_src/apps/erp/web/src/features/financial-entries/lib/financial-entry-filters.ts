import type { FinancialEntryListFilters } from "@/features/financial-entries/types/financial-entry";

export function createEmptyFinancialEntryFilters(): FinancialEntryListFilters {
  return {
    operations: [],
    statuses: [],
    categoryIds: [],
    costCenterIds: [],
    dueFrom: null,
    dueTo: null,
  };
}

export function countActiveFinancialEntryFilters(
  filters: FinancialEntryListFilters,
): number {
  let count = 0;
  if (filters.operations.length > 0) count += 1;
  if (filters.statuses.length > 0) count += 1;
  if (filters.categoryIds.length > 0) count += 1;
  if (filters.costCenterIds.length > 0) count += 1;
  if (filters.dueFrom || filters.dueTo) count += 1;
  return count;
}
