import type {
  DashboardInadimplenciaDebt,
  DashboardInadimplenciaDebtRow,
  DashboardInadimplenciaReport,
  DashboardInadimplenciaSlice,
  InadimplenciaPeriodMode,
} from '../types/clinic-dashboard';
import { parseLocalDateString } from '@/features/clinic/agenda/lib/local-date';
import {
  DASHBOARD_MONTH_OPTIONS,
  buildFinancialPeriodKey,
} from './dashboard-financial';

export const INADIMPLENCIA_PERIOD_MODE_OPTIONS = [
  { value: 'annual', label: 'Anual' },
  { value: 'monthly', label: 'Mensal' },
] as const;

export const INADIMPLENCIA_SLICE_COLORS = {
  unpaid: '#ef4444',
  received: '#16a34a',
} as const;

export function filterInadimplenciaDebts(
  debts: readonly DashboardInadimplenciaDebt[],
  input: {
    mode: InadimplenciaPeriodMode;
    year: number;
    month: number;
  },
): DashboardInadimplenciaDebt[] {
  const { mode, year, month } = input;
  const inPeriod = (dueDate: string): boolean => {
    if (mode === 'annual') return dueDate.startsWith(String(year));
    return dueDate.startsWith(buildFinancialPeriodKey(year, month));
  };

  return debts.filter(
    (debt) =>
      debt.patientCurrentlyDelinquent &&
      debt.totalCents > 0 &&
      debt.unpaidCents >= 0 &&
      debt.unpaidCents <= debt.totalCents &&
      inPeriod(debt.dueDate),
  );
}

function roundPercent(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Taxa = (Valor Total Não Recebido / Valor Total dos Débitos) × 100%.
 * Apenas pacientes inadimplentes no momento; valores brutos.
 */
export function buildInadimplenciaReport(
  debts: readonly DashboardInadimplenciaDebt[],
): DashboardInadimplenciaReport {
  let totalDebtsCents = 0;
  let unpaidCents = 0;

  for (const debt of debts) {
    totalDebtsCents += debt.totalCents;
    unpaidCents += debt.unpaidCents;
  }

  const receivedCents = Math.max(0, totalDebtsCents - unpaidCents);
  const ratePercent =
    totalDebtsCents <= 0
      ? 0
      : roundPercent((unpaidCents / totalDebtsCents) * 100);

  return buildInadimplenciaReportFromTotals({
    totalDebtsCents,
    unpaidCents,
    receivedCents,
    ratePercent,
  });
}

/** Monta report + slices a partir do agregado da API. */
export function buildInadimplenciaReportFromTotals(input: {
  totalDebtsCents: number;
  unpaidCents: number;
  receivedCents: number;
  ratePercent: number;
}): DashboardInadimplenciaReport {
  const unpaidPercent = input.ratePercent;
  const receivedPercent =
    input.totalDebtsCents <= 0 ? 0 : roundPercent(100 - input.ratePercent);

  const slices: DashboardInadimplenciaSlice[] = [
    {
      key: 'unpaid',
      label: 'Inadimplência',
      valueCents: input.unpaidCents,
      percent: unpaidPercent,
      color: INADIMPLENCIA_SLICE_COLORS.unpaid,
    },
    {
      key: 'received',
      label: 'Adimplência',
      valueCents: input.receivedCents,
      percent: receivedPercent,
      color: INADIMPLENCIA_SLICE_COLORS.received,
    },
  ];

  return {
    totalDebtsCents: input.totalDebtsCents,
    unpaidCents: input.unpaidCents,
    receivedCents: input.receivedCents,
    ratePercent: input.ratePercent,
    slices,
  };
}

export function getInadimplenciaYears(
  debts: readonly DashboardInadimplenciaDebt[],
): number[] {
  return [
    ...new Set(debts.map((debt) => Number(debt.dueDate.slice(0, 4)))),
  ]
    .filter(Number.isFinite)
    .sort((a, b) => b - a);
}

export function formatInadimplenciaRate(percent: number): string {
  return `${percent.toLocaleString('pt-BR', {
    minimumFractionDigits: percent % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  })}%`;
}

export function formatInadimplenciaDialogTitle(input: {
  mode: InadimplenciaPeriodMode;
  year: number;
  month: number;
}): string {
  if (input.mode === 'annual') {
    return `Inadimplentes de ${input.year}`;
  }
  const monthLabel =
    DASHBOARD_MONTH_OPTIONS.find((option) => option.value === input.month)
      ?.label ?? String(input.month);
  return `Inadimplentes de ${monthLabel} de ${input.year}`;
}

/** Dias corridos desde o vencimento até a data de referência (mínimo 0). */
export function daysOverdueFromDueDate(
  dueDate: string,
  referenceDate: Date = new Date(),
): number {
  const due = parseLocalDateString(dueDate);
  if (Number.isNaN(due.getTime())) return 0;

  const ref = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diffMs = ref.getTime() - dueDay.getTime();
  return Math.max(0, Math.floor(diffMs / 86_400_000));
}

/** Débitos com saldo em aberto, ordenados por vencimento (mais antigo primeiro). */
export function listUnpaidInadimplenciaDebts(
  debts: readonly DashboardInadimplenciaDebt[],
  referenceDate: Date = new Date(),
): DashboardInadimplenciaDebtRow[] {
  return debts
    .filter((debt) => debt.unpaidCents > 0)
    .map((debt) => ({
      id: debt.id,
      dueDate: debt.dueDate,
      daysOverdue: daysOverdueFromDueDate(debt.dueDate, referenceDate),
      patientId: debt.patientId,
      patientName: debt.patientName,
      description: debt.description,
      phone: debt.phone,
      unpaidCents: debt.unpaidCents,
    }))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}
