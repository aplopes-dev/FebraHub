import type {
  CommissionsPeriodMode,
  DashboardCommissionBreakdownItem,
  DashboardCommissionPaidRow,
  DashboardCommissionProfessionalRank,
  DashboardCommissionRuleGroup,
  DashboardCommissionTrigger,
  DashboardCommissionType,
} from '../types/clinic-dashboard';

export const COMMISSIONS_PERIOD_MODE_OPTIONS = [
  { value: 'annual', label: 'Anual' },
  { value: 'monthly', label: 'Mensal' },
] as const;

export const DASHBOARD_COMMISSION_TRIGGER_LABELS: Record<
  DashboardCommissionTrigger,
  string
> = {
  treatment_completed: 'Procedimento finalizado',
  debit_received: 'Débito recebido do paciente',
  budget_approved: 'Aprovação de orçamento',
};

export const DASHBOARD_COMMISSION_TYPE_LABELS: Record<
  DashboardCommissionType,
  string
> = {
  fixed_value: 'Comissão por valor fixo (R$)',
  percentage: 'Comissão por percentual (%)',
};

const TRIGGER_ORDER: DashboardCommissionTrigger[] = [
  'treatment_completed',
  'debit_received',
  'budget_approved',
];

const TYPE_ORDER: DashboardCommissionType[] = ['fixed_value', 'percentage'];

type FilterCardPeriodInput = {
  rows: readonly DashboardCommissionPaidRow[];
  periodMode: CommissionsPeriodMode;
  year: number;
  month?: number;
};

export function filterCommissionsByCardPeriod({
  rows,
  periodMode,
  year,
  month,
}: FilterCardPeriodInput): DashboardCommissionPaidRow[] {
  const yearPrefix = `${year}-`;
  const monthPrefix = `${year}-${String(month ?? 0).padStart(2, '0')}-`;

  return rows.filter((row) =>
    periodMode === 'annual'
      ? row.paidAt.startsWith(yearPrefix)
      : row.paidAt.startsWith(monthPrefix),
  );
}

export function filterCommissionsByDateRange(
  rows: readonly DashboardCommissionPaidRow[],
  startDate: string,
  endDate: string,
): DashboardCommissionPaidRow[] {
  return rows.filter(
    (row) => row.paidAt >= startDate && row.paidAt <= endDate,
  );
}

export function filterCommissionsForProfessional(
  rows: readonly DashboardCommissionPaidRow[],
  professionalId: string | null,
): DashboardCommissionPaidRow[] {
  if (!professionalId) return [...rows];
  return rows.filter((row) => row.professionalId === professionalId);
}

export function summarizeCommissionNetTotal(
  rows: readonly DashboardCommissionPaidRow[],
): number {
  return rows.reduce((sum, row) => sum + row.netCents, 0);
}

export function summarizeCommissionGrossTotal(
  rows: readonly DashboardCommissionPaidRow[],
): number {
  return rows.reduce((sum, row) => sum + row.grossCents, 0);
}

function toPercent(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 1000) / 10;
}

export function summarizeByTrigger(
  rows: readonly DashboardCommissionPaidRow[],
): DashboardCommissionBreakdownItem[] {
  const grossTotal = summarizeCommissionGrossTotal(rows);
  const byTrigger = new Map<DashboardCommissionTrigger, number>();

  for (const row of rows) {
    byTrigger.set(row.trigger, (byTrigger.get(row.trigger) ?? 0) + row.grossCents);
  }

  return TRIGGER_ORDER.map((trigger) => {
    const grossCents = byTrigger.get(trigger) ?? 0;
    return {
      key: trigger,
      label: DASHBOARD_COMMISSION_TRIGGER_LABELS[trigger],
      grossCents,
      percent: toPercent(grossCents, grossTotal),
    };
  });
}

export function summarizeByType(
  rows: readonly DashboardCommissionPaidRow[],
): DashboardCommissionBreakdownItem[] {
  const grossTotal = summarizeCommissionGrossTotal(rows);
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
      label: DASHBOARD_COMMISSION_TYPE_LABELS[type],
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

export function getCommissionYears(
  rows: readonly DashboardCommissionPaidRow[],
): number[] {
  return [
    ...new Set(rows.map((row) => Number(row.paidAt.slice(0, 4)))),
  ]
    .filter(Number.isFinite)
    .sort((a, b) => b - a);
}

function ruleGroupKey(row: DashboardCommissionPaidRow): string {
  return `${row.trigger}|${row.planName}|${row.specialtyName}|${row.treatmentName}`;
}

/** Agrupa linhas do dialog por regra + plano + especialidade + tratamento. */
export function groupCommissionsByRule(
  rows: readonly DashboardCommissionPaidRow[],
): DashboardCommissionRuleGroup[] {
  const buckets = new Map<string, DashboardCommissionPaidRow[]>();

  for (const row of rows) {
    const key = ruleGroupKey(row);
    const current = buckets.get(key);
    if (current) {
      buckets.set(key, [...current, row]);
    } else {
      buckets.set(key, [row]);
    }
  }

  const groups: DashboardCommissionRuleGroup[] = [];

  for (const [key, groupRows] of buckets) {
    const first = groupRows[0];
    if (!first) continue;
    const sortedRows = [...groupRows].sort((a, b) =>
      a.paidAt.localeCompare(b.paidAt),
    );
    groups.push({
      id: key,
      trigger: first.trigger,
      triggerLabel: DASHBOARD_COMMISSION_TRIGGER_LABELS[first.trigger],
      planName: first.planName,
      specialtyName: first.specialtyName,
      treatmentSummary: first.treatmentName,
      totalNetCents: summarizeCommissionNetTotal(sortedRows),
      rows: sortedRows,
    });
  }

  return groups.sort((a, b) => {
    const triggerDiff =
      TRIGGER_ORDER.indexOf(a.trigger) - TRIGGER_ORDER.indexOf(b.trigger);
    if (triggerDiff !== 0) return triggerDiff;
    return (
      a.planName.localeCompare(b.planName, 'pt-BR') ||
      a.specialtyName.localeCompare(b.specialtyName, 'pt-BR') ||
      a.treatmentSummary.localeCompare(b.treatmentSummary, 'pt-BR')
    );
  });
}
