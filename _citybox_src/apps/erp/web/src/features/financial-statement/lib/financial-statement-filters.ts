import type { FinancialStatementFilters } from "@/features/financial-statement/types/financial-statement";

export function createEmptyFinancialStatementFilters(): FinancialStatementFilters {
  return {
    operations: [],
    statuses: [],
    categoryIds: [],
    costCenterIds: [],
    bankAccountId: null,
    dateAxis: "competence",
    dateFrom: null,
    dateTo: null,
  };
}

export function countActiveFinancialStatementFilters(
  filters: FinancialStatementFilters,
): number {
  let count = 0;
  if (filters.operations.length > 0) count += 1;
  if (filters.statuses.length > 0) count += 1;
  if (filters.categoryIds.length > 0) count += 1;
  if (filters.costCenterIds.length > 0) count += 1;
  if (filters.bankAccountId) count += 1;
  if (filters.dateFrom || filters.dateTo) count += 1;
  return count;
}
