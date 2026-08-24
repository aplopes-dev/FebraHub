import { addDays, endOfMonth, format, startOfMonth, startOfToday, subDays, subMonths } from 'date-fns';
import { resolveClinicWeekRange } from '@/features/clinic/lib/resolve-clinic-week-range';
import type {
  CommissionPeriodFilter,
  CommissionRuleGroup,
  CommissionSummaryRow,
  CommissionTreatmentRow,
} from '../types/commission-financial.types';

export type PeriodDateRange = {
  startDate: string;
  endDate: string;
};

/** Resolve o intervalo yyyy-MM-dd a partir do filtro de período (mock / UI). */
export function resolveCommissionPeriodDates(
  period: CommissionPeriodFilter,
  customStart?: Date,
  customEnd?: Date,
): PeriodDateRange {
  const today = startOfToday();

  switch (period) {
    case 'today':
      return {
        startDate: format(today, 'yyyy-MM-dd'),
        endDate: format(today, 'yyyy-MM-dd'),
      };
    case 'this_week':
      return resolveClinicWeekRange(today);
    case 'this_month':
      return {
        startDate: format(startOfMonth(today), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(today), 'yyyy-MM-dd'),
      };
    case 'last_month': {
      const lastMonth = subMonths(today, 1);
      return {
        startDate: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(lastMonth), 'yyyy-MM-dd'),
      };
    }
    case 'last_30_days':
      return {
        startDate: format(subDays(today, 30), 'yyyy-MM-dd'),
        endDate: format(today, 'yyyy-MM-dd'),
      };
    case 'custom':
      if (customStart && customEnd) {
        return {
          startDate: format(customStart, 'yyyy-MM-dd'),
          endDate: format(customEnd, 'yyyy-MM-dd'),
        };
      }
      return {
        startDate: format(today, 'yyyy-MM-dd'),
        endDate: format(today, 'yyyy-MM-dd'),
      };
  }
}

function isDateInRange(isoDate: string, range: PeriodDateRange): boolean {
  return isoDate >= range.startDate && isoDate <= range.endDate;
}

function filterRuleGroup(
  group: CommissionRuleGroup,
  range: PeriodDateRange,
): CommissionRuleGroup | null {
  const rows: CommissionTreatmentRow[] = group.rows.filter((row) =>
    isDateInRange(row.paidAt, range),
  );
  if (rows.length === 0) return null;

  const totalCommissionCents = rows.reduce((sum, row) => sum + row.commissionCents, 0);
  return {
    ...group,
    rows,
    totalCommissionCents,
  };
}

/**
 * Filtra comissões em aberto: mantém treatment rows cujo `paidAt` cai no período,
 * recalcula totais. Profissionais com regra configurada e sem linhas no período são
 * omitidos; profissionais sem comissão configurada permanecem (total 0).
 */
export function filterOpenCommissionsByPeriod(
  rows: CommissionSummaryRow[],
  range: PeriodDateRange,
): CommissionSummaryRow[] {
  return rows.flatMap((row) => {
    if (!row.hasCommissionConfigured) {
      return [
        {
          ...row,
          totalCents: 0,
          ruleGroups: [],
        },
      ];
    }

    const ruleGroups = row.ruleGroups
      .map((group) => filterRuleGroup(group, range))
      .filter((group): group is CommissionRuleGroup => group !== null);

    if (ruleGroups.length === 0) return [];

    const totalCents = ruleGroups.reduce((sum, g) => sum + g.totalCommissionCents, 0);
    return [
      {
        ...row,
        ruleGroups,
        totalCents,
      },
    ];
  });
}

/** Filtra histórico: mantém pagamentos cujo `paidAt` (data do repasse) cai no período. */
export function filterHistoryCommissionsByPeriod(
  rows: CommissionSummaryRow[],
  range: PeriodDateRange,
): CommissionSummaryRow[] {
  return rows.filter((row) => row.paidAt !== undefined && isDateInRange(row.paidAt, range));
}

/** Filtra o detalhe de uma linha (modal) pelas treatment rows do período. */
export function filterCommissionRowByPeriod(
  row: CommissionSummaryRow,
  range: PeriodDateRange,
): CommissionSummaryRow {
  const ruleGroups = row.ruleGroups
    .map((group) => filterRuleGroup(group, range))
    .filter((group): group is CommissionRuleGroup => group !== null);

  const totalCents = ruleGroups.reduce((sum, g) => sum + g.totalCommissionCents, 0);

  return {
    ...row,
    ruleGroups,
    totalCents: ruleGroups.length > 0 ? totalCents : row.totalCents,
  };
}
