import type {
  BudgetAnalysisAggregate,
  BudgetAnalysisDimension,
  BudgetChartMetric,
  BudgetPeriodMode,
  BudgetStatusSummary,
  BudgetStatusTimelinePoint,
  DashboardBudgetAnalysisRow,
  DashboardBudgetAnalysisStatus,
} from '../types/clinic-dashboard';

type FilterDashboardBudgetsInput = {
  budgets: DashboardBudgetAnalysisRow[];
  periodMode: BudgetPeriodMode;
  year: number;
  month?: number;
  professionalId?: string;
  status?: DashboardBudgetAnalysisStatus;
};

type BuildBudgetStatusTimelineChartInput = {
  budgets: DashboardBudgetAnalysisRow[];
  periodMode: BudgetPeriodMode;
  year: number;
  month?: number;
  metric: BudgetChartMetric;
};

const DIMENSION_FIELDS = {
  professionals: {
    key: 'professionalId',
    name: 'professionalName',
  },
  plans: {
    key: 'planId',
    name: 'planName',
  },
  treatments: {
    key: 'treatmentId',
    name: 'treatmentName',
  },
} as const satisfies Record<
  BudgetAnalysisDimension,
  {
    key: keyof DashboardBudgetAnalysisRow;
    name: keyof DashboardBudgetAnalysisRow;
  }
>;

export const BUDGET_STATUS_LABELS: Record<
  DashboardBudgetAnalysisStatus,
  string
> = {
  approved: 'Aprovados',
  rejected: 'Reprovados',
  open: 'Em aberto',
};

export const BUDGET_MONTH_ABBREVIATIONS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
] as const;

export const BUDGET_PERIOD_MODE_OPTIONS = [
  { value: 'annual', label: 'Anual' },
  { value: 'monthly', label: 'Mensal' },
] as const;

export const BUDGET_ANALYSIS_DIMENSIONS = [
  { value: 'professionals', label: 'Profissionais' },
  { value: 'plans', label: 'Planos' },
  { value: 'treatments', label: 'Procedimentos' },
] as const;

function emptyTimelinePoint(
  key: string,
  label: string,
): BudgetStatusTimelinePoint {
  return {
    key,
    label,
    approved: 0,
    rejected: 0,
    open: 0,
  };
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function filterDashboardBudgets({
  budgets,
  periodMode,
  year,
  month,
  professionalId,
  status,
}: FilterDashboardBudgetsInput): DashboardBudgetAnalysisRow[] {
  const yearPrefix = `${year}-`;
  const monthPrefix = `${year}-${String(month ?? 0).padStart(2, '0')}-`;

  return budgets.filter((budget) => {
    const matchesPeriod =
      periodMode === 'annual'
        ? budget.budgetDate.startsWith(yearPrefix)
        : budget.budgetDate.startsWith(monthPrefix);
    const matchesProfessional =
      !professionalId || budget.professionalId === professionalId;
    const matchesStatus = !status || budget.status === status;
    return matchesPeriod && matchesProfessional && matchesStatus;
  });
}

export function summarizeDashboardBudgetStatus(
  budgets: DashboardBudgetAnalysisRow[],
): BudgetStatusSummary {
  const initial: BudgetStatusSummary = {
    approved: { count: 0, totalCents: 0 },
    rejected: { count: 0, totalCents: 0 },
    open: { count: 0, totalCents: 0 },
    approvalRate: 0,
    totalCount: budgets.length,
  };
  const summary = budgets.reduce<BudgetStatusSummary>(
    (result, budget) => ({
      ...result,
      [budget.status]: {
        count: result[budget.status].count + 1,
        totalCents: result[budget.status].totalCents + budget.valueCents,
      },
    }),
    initial,
  );

  return {
    ...summary,
    approvalRate:
      summary.totalCount > 0
        ? (summary.approved.count / summary.totalCount) * 100
        : 0,
  };
}

export function buildBudgetStatusTimelineChart({
  budgets,
  periodMode,
  year,
  month,
  metric,
}: BuildBudgetStatusTimelineChartInput): BudgetStatusTimelinePoint[] {
  const points =
    periodMode === 'annual'
      ? BUDGET_MONTH_ABBREVIATIONS.map((label, index) =>
          emptyTimelinePoint(
            `${year}-${String(index + 1).padStart(2, '0')}`,
            label,
          ),
        )
      : Array.from({ length: daysInMonth(year, month ?? 1) }, (_, index) => {
          const day = index + 1;
          return emptyTimelinePoint(
            `${year}-${String(month ?? 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
            String(day),
          );
        });

  const byKey = new Map(points.map((point) => [point.key, point]));

  for (const budget of budgets) {
    const key =
      periodMode === 'annual'
        ? budget.budgetDate.slice(0, 7)
        : budget.budgetDate;
    const current = byKey.get(key);
    if (!current) continue;
    const increment = metric === 'quantity' ? 1 : budget.valueCents / 100;
    byKey.set(key, {
      ...current,
      [budget.status]: current[budget.status] + increment,
    });
  }

  return points.map((point) => byKey.get(point.key) ?? point);
}

export function aggregateDashboardBudgets(
  budgets: DashboardBudgetAnalysisRow[],
  dimension: BudgetAnalysisDimension,
): BudgetAnalysisAggregate[] {
  const fields = DIMENSION_FIELDS[dimension];
  const grouped = new Map<string, BudgetAnalysisAggregate>();

  for (const budget of budgets) {
    const key = String(budget[fields.key]);
    const name = String(budget[fields.name]);
    const current = grouped.get(key);
    grouped.set(key, {
      key,
      name,
      count: (current?.count ?? 0) + 1,
      totalCents: (current?.totalCents ?? 0) + budget.valueCents,
    });
  }

  return [...grouped.values()].sort(
    (a, b) =>
      b.totalCents - a.totalCents ||
      a.name.localeCompare(b.name, 'pt-BR'),
  );
}

export function filterDashboardBudgetDetails(
  budgets: DashboardBudgetAnalysisRow[],
  dimension: BudgetAnalysisDimension,
  dimensionKey: string,
): DashboardBudgetAnalysisRow[] {
  const field = DIMENSION_FIELDS[dimension].key;
  return budgets.filter((budget) => String(budget[field]) === dimensionKey);
}

export function getDashboardBudgetYears(
  budgets: DashboardBudgetAnalysisRow[],
): number[] {
  return [...new Set(budgets.map((budget) => Number(budget.budgetDate.slice(0, 4))))]
    .filter(Number.isFinite)
    .sort((a, b) => b - a);
}

export function getDashboardBudgetProfessionals(
  budgets: DashboardBudgetAnalysisRow[],
): Array<{ id: string; name: string }> {
  return [
    ...new Map(
      budgets.map((budget) => [
        budget.professionalId,
        { id: budget.professionalId, name: budget.professionalName },
      ]),
    ).values(),
  ].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

/** Converte timeline da API (count+cents) para pontos do gráfico Recharts. */
export function mapBudgetStatusTimelineForChart(
  timeline: readonly import('../types/clinic-dashboard').BudgetStatusTimelineApiPoint[],
  metric: BudgetChartMetric,
): BudgetStatusTimelinePoint[] {
  return timeline.map((point) => ({
    key: point.key,
    label: point.label,
    approved:
      metric === 'quantity'
        ? point.approved.count
        : point.approved.totalCents / 100,
    rejected:
      metric === 'quantity'
        ? point.rejected.count
        : point.rejected.totalCents / 100,
    open:
      metric === 'quantity' ? point.open.count : point.open.totalCents / 100,
  }));
}
