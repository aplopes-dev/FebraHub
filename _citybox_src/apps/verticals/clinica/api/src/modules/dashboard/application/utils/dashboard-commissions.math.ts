import { toIsoDateOnly } from '../../../financial/entries/application/utils/financial-entry.utils';
import { civilDayEndUtc, civilDayStartUtc } from './dashboard-patients.dates';
import { COMMISSION_TRIGGER_LABELS } from '../../../commissions/shared/domain/commission-enums';
import type {
  DashboardCommissionBreakdownItem,
  DashboardCommissionPaidRow,
  DashboardCommissionPaymentBundle,
  DashboardCommissionProfessionalRank,
  DashboardCommissionTrigger,
  DashboardCommissionType,
  DashboardCommissionsPeriodMode,
  DashboardCommissionsSummary,
} from './dashboard-commissions.types';

export const COMMISSION_TYPE_LABELS: Record<DashboardCommissionType, string> = {
  fixed_value: 'Comissão por valor fixo (R$)',
  percentage: 'Comissão por percentual (%)',
};

const TRIGGER_ORDER: DashboardCommissionTrigger[] = [
  'treatment_completed',
  'debit_received',
  'budget_approved',
];

const TYPE_ORDER: DashboardCommissionType[] = ['fixed_value', 'percentage'];

export function resolveCommissionsPeriodRange(input: {
  periodMode: DashboardCommissionsPeriodMode;
  year: number;
  month?: number;
}): { startIsoDate: string; endIsoDate: string; startAt: Date; endAt: Date } {
  const { periodMode, year, month } = input;
  let startIsoDate: string;
  let endIsoDate: string;

  if (periodMode === 'annual') {
    startIsoDate = `${year}-01-01`;
    endIsoDate = `${year}-12-31`;
  } else {
    if (month == null || month < 1 || month > 12) {
      throw new Error('month is required for monthly periodMode');
    }
    const padded = String(month).padStart(2, '0');
    const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
    startIsoDate = `${year}-${padded}-01`;
    endIsoDate = `${year}-${padded}-${String(days).padStart(2, '0')}`;
  }

  return {
    startIsoDate,
    endIsoDate,
    startAt: civilDayStartUtc(startIsoDate),
    endAt: civilDayEndUtc(endIsoDate),
  };
}

/**
 * Rateia o desconto do pagamento pelos commissionCents dos items
 * (último item absorve o resto).
 */
export function allocateDiscountAcrossItems(
  items: ReadonlyArray<{ commissionCents: number }>,
  discountCents: number,
): number[] {
  if (items.length === 0) return [];
  const totalGross = items.reduce((sum, item) => sum + item.commissionCents, 0);
  if (discountCents <= 0 || totalGross <= 0) {
    return items.map(() => 0);
  }

  let allocated = 0;
  return items.map((item, index) => {
    const isLast = index === items.length - 1;
    const share = isLast
      ? Math.max(0, discountCents - allocated)
      : Math.round((item.commissionCents / totalGross) * discountCents);
    allocated += share;
    return share;
  });
}

export function flattenCommissionPaymentToRows(
  bundle: DashboardCommissionPaymentBundle,
): DashboardCommissionPaidRow[] {
  const paidAt = toIsoDateOnly(bundle.paymentDate);
  const discounts = allocateDiscountAcrossItems(
    bundle.items,
    bundle.discountCents,
  );

  return bundle.items.map((item, index) => {
    const discountCents = discounts[index] ?? 0;
    const grossCents = item.commissionCents;
    return {
      id: item.accrualId,
      paidAt,
      professionalId: bundle.memberId,
      professionalName: bundle.memberName,
      trigger: item.paymentTrigger,
      commissionType: item.commissionType,
      grossCents,
      discountCents,
      netCents: Math.max(0, grossCents - discountCents),
      patientName: item.patientName,
      planName: item.planName,
      specialtyName: item.specialtyName,
      treatmentName: item.treatmentName,
      treatmentValueCents: item.paidValueCents,
      treatmentCostCents: item.treatmentCostCents,
      installment: item.installment,
    };
  });
}

export function flattenCommissionPayments(
  bundles: readonly DashboardCommissionPaymentBundle[],
): DashboardCommissionPaidRow[] {
  return bundles.flatMap(flattenCommissionPaymentToRows);
}

function toPercent(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 1000) / 10;
}

function summarizeGrossTotal(
  rows: readonly DashboardCommissionPaidRow[],
): number {
  return rows.reduce((sum, row) => sum + row.grossCents, 0);
}

export function summarizeCommissionNetTotal(
  rows: readonly DashboardCommissionPaidRow[],
): number {
  return rows.reduce((sum, row) => sum + row.netCents, 0);
}

export function summarizeByTrigger(
  rows: readonly DashboardCommissionPaidRow[],
): DashboardCommissionBreakdownItem[] {
  const grossTotal = summarizeGrossTotal(rows);
  const byTrigger = new Map<DashboardCommissionTrigger, number>();

  for (const row of rows) {
    byTrigger.set(
      row.trigger,
      (byTrigger.get(row.trigger) ?? 0) + row.grossCents,
    );
  }

  return TRIGGER_ORDER.map((trigger) => {
    const grossCents = byTrigger.get(trigger) ?? 0;
    return {
      key: trigger,
      label: COMMISSION_TRIGGER_LABELS[trigger],
      grossCents,
      percent: toPercent(grossCents, grossTotal),
    };
  });
}

export function summarizeByType(
  rows: readonly DashboardCommissionPaidRow[],
): DashboardCommissionBreakdownItem[] {
  const grossTotal = summarizeGrossTotal(rows);
  const byType = new Map<DashboardCommissionType, number>();

  for (const row of rows) {
    byType.set(
      row.commissionType,
      (byType.get(row.commissionType) ?? 0) + row.grossCents,
    );
  }

  return TYPE_ORDER.map((type) => {
    const grossCents = byType.get(type) ?? 0;
    return {
      key: type,
      label: COMMISSION_TYPE_LABELS[type],
      grossCents,
      percent: toPercent(grossCents, grossTotal),
    };
  });
}

export function rankProfessionalsByNet(
  rows: readonly DashboardCommissionPaidRow[],
): DashboardCommissionProfessionalRank[] {
  const byPro = new Map<string, DashboardCommissionProfessionalRank>();

  for (const row of rows) {
    const current = byPro.get(row.professionalId);
    if (current) {
      byPro.set(row.professionalId, {
        ...current,
        netCents: current.netCents + row.netCents,
        count: current.count + 1,
      });
    } else {
      byPro.set(row.professionalId, {
        professionalId: row.professionalId,
        professionalName: row.professionalName,
        netCents: row.netCents,
        count: 1,
      });
    }
  }

  return [...byPro.values()].sort(
    (a, b) =>
      b.netCents - a.netCents ||
      a.professionalName.localeCompare(b.professionalName, 'pt-BR'),
  );
}

export function buildCommissionsSummary(
  rows: readonly DashboardCommissionPaidRow[],
): DashboardCommissionsSummary {
  return {
    netTotalCents: summarizeCommissionNetTotal(rows),
    byTrigger: summarizeByTrigger(rows),
    byType: summarizeByType(rows),
    ranking: rankProfessionalsByNet(rows),
  };
}

export function filterCommissionRowsByProfessional(
  rows: readonly DashboardCommissionPaidRow[],
  professionalId?: string,
): DashboardCommissionPaidRow[] {
  if (!professionalId) return [...rows];
  return rows.filter((row) => row.professionalId === professionalId);
}

export function sortCommissionDetailRows(
  rows: readonly DashboardCommissionPaidRow[],
): DashboardCommissionPaidRow[] {
  return [...rows].sort(
    (a, b) => a.paidAt.localeCompare(b.paidAt) || a.id.localeCompare(b.id),
  );
}

export function paginateCommissionRows(
  rows: readonly DashboardCommissionPaidRow[],
  page: number,
  perPage: number,
): {
  items: DashboardCommissionPaidRow[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  totalNetCents: number;
} {
  const sorted = sortCommissionDetailRows(rows);
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * perPage;

  return {
    items: sorted.slice(start, start + perPage),
    total,
    page: safePage,
    perPage,
    totalPages,
    totalNetCents: summarizeCommissionNetTotal(sorted),
  };
}
