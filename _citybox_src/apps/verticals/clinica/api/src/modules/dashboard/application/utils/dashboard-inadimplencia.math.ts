import { toIsoDateOnly } from '../../../financial/entries/application/utils/financial-entry.utils';
import { civilDayEndUtc, civilDayStartUtc } from './dashboard-patients.dates';
import type {
  DashboardInadimplenciaDetailRow,
  DashboardInadimplenciaPeriodMode,
  DashboardInadimplenciaReport,
  InadimplenciaDebtRow,
} from './dashboard-inadimplencia.types';

export function resolveInadimplenciaPeriodRange(input: {
  periodMode: DashboardInadimplenciaPeriodMode;
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

function roundPercent(value: number): number {
  return Math.round(value * 10) / 10;
}

export function resolveInadimplenciaUnpaidCents(
  debt: Pick<InadimplenciaDebtRow, 'status' | 'valueCents'>,
): number {
  return debt.status === 'pending' ? debt.valueCents : 0;
}

export function buildInadimplenciaReport(
  debts: readonly InadimplenciaDebtRow[],
): DashboardInadimplenciaReport {
  let totalDebtsCents = 0;
  let unpaidCents = 0;

  for (const debt of debts) {
    totalDebtsCents += debt.valueCents;
    unpaidCents += resolveInadimplenciaUnpaidCents(debt);
  }

  const receivedCents = Math.max(0, totalDebtsCents - unpaidCents);
  const ratePercent =
    totalDebtsCents <= 0
      ? 0
      : roundPercent((unpaidCents / totalDebtsCents) * 100);

  return {
    totalDebtsCents,
    unpaidCents,
    receivedCents,
    ratePercent,
  };
}

/** Dias corridos desde o vencimento (civil UTC) até todayKey; mínimo 0. */
export function daysOverdueFromDueDate(
  dueDate: Date,
  todayKey: string,
): number {
  const dueKey = toIsoDateOnly(dueDate);
  const dueMs = Date.parse(`${dueKey}T00:00:00.000Z`);
  const todayMs = Date.parse(`${todayKey}T00:00:00.000Z`);
  if (Number.isNaN(dueMs) || Number.isNaN(todayMs)) return 0;
  return Math.max(0, Math.floor((todayMs - dueMs) / 86_400_000));
}

export function mapUnpaidInadimplenciaDetails(
  debts: readonly InadimplenciaDebtRow[],
  todayKey: string,
): DashboardInadimplenciaDetailRow[] {
  return debts
    .map((debt) => {
      const unpaidCents = resolveInadimplenciaUnpaidCents(debt);
      return {
        id: debt.id,
        dueDate: toIsoDateOnly(debt.dueDate),
        daysOverdue: daysOverdueFromDueDate(debt.dueDate, todayKey),
        patientId: debt.patientId,
        patientName: debt.patientName,
        description: debt.description,
        phone: debt.phone,
        unpaidCents,
      };
    })
    .filter((row) => row.unpaidCents > 0)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export function paginateInadimplenciaDetails(
  rows: readonly DashboardInadimplenciaDetailRow[],
  page: number,
  perPage: number,
): {
  items: DashboardInadimplenciaDetailRow[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
} {
  const safePage = Math.max(1, page);
  const safePerPage = Math.max(1, perPage);
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / safePerPage));
  const start = (safePage - 1) * safePerPage;
  return {
    items: rows.slice(start, start + safePerPage),
    total,
    page: safePage,
    perPage: safePerPage,
    totalPages,
  };
}
