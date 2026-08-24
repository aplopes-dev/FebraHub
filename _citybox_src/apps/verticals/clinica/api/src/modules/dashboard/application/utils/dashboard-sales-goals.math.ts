import { toIsoDateOnly } from '../../../financial/entries/application/utils/financial-entry.utils';
import type { ApprovedBudgetWithItems } from '../../../patients/patient-budgets/domain/repositories/budget.repository.interface';

export type DashboardDailySale = {
  date: string;
  valueCents: number;
};

/**
 * Aggregate approved-budget item cents by civil sale date
 * (`approvedAt` fallback `budget.date`).
 */
export function aggregateApprovedBudgetDailySales(
  rows: readonly ApprovedBudgetWithItems[],
  startIsoDate: string,
  endIsoDate: string,
): DashboardDailySale[] {
  const byDate = new Map<string, number>();

  for (const row of rows) {
    const saleDate = toIsoDateOnly(row.budget.approvedAt ?? row.budget.date);
    if (saleDate < startIsoDate || saleDate > endIsoDate) continue;
    let dayTotal = byDate.get(saleDate) ?? 0;
    for (const item of row.items) {
      dayTotal += item.valueCents;
    }
    byDate.set(saleDate, dayTotal);
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, valueCents]) => ({ date, valueCents }));
}

export function sumDailySalesCents(
  dailySales: readonly DashboardDailySale[],
): number {
  return dailySales.reduce((total, row) => total + row.valueCents, 0);
}

export function sumDailySalesOnDate(
  dailySales: readonly DashboardDailySale[],
  isoDate: string,
): number {
  return dailySales
    .filter((row) => row.date === isoDate)
    .reduce((total, row) => total + row.valueCents, 0);
}
