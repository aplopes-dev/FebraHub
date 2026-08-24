import type { Budget } from '../../../patients/patient-budgets/domain/entities/budget.entity';
import type { BudgetItem } from '../../../patients/patient-budgets/domain/entities/budget-item.entity';
import { formatDateOnly } from '../../../patients/application/mappers/patient-form.mapper';
import type {
  DashboardBudgetAnalysisAggregate,
  DashboardBudgetAnalysisDimension,
  DashboardBudgetAnalysisRow,
  DashboardBudgetCountCents,
  DashboardBudgetPeriodMode,
  DashboardBudgetTimelinePoint,
  DashboardBudgetUiStatus,
} from './dashboard-budget-analysis.types';

const MONTH_ABBREVIATIONS = [
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

export function resolveBudgetAnalysisPeriodRange(input: {
  periodMode: DashboardBudgetPeriodMode;
  year: number;
  month?: number;
}): { startIsoDate: string; endIsoDate: string } {
  const { periodMode, year, month } = input;
  if (periodMode === 'annual') {
    return {
      startIsoDate: `${year}-01-01`,
      endIsoDate: `${year}-12-31`,
    };
  }
  if (month == null || month < 1 || month > 12) {
    throw new Error('month is required for monthly periodMode');
  }
  const padded = String(month).padStart(2, '0');
  const days = new Date(year, month, 0).getDate();
  return {
    startIsoDate: `${year}-${padded}-01`,
    endIsoDate: `${year}-${padded}-${String(days).padStart(2, '0')}`,
  };
}

export function mapBudgetStatusToUi(
  status: Budget['status'],
): DashboardBudgetUiStatus | null {
  if (status === 'pending') return 'open';
  if (status === 'approved' || status === 'rejected') return status;
  return null; // expired
}

function emptyCountCents(): DashboardBudgetCountCents {
  return { count: 0, totalCents: 0 };
}

function emptyTimelinePoint(
  key: string,
  label: string,
): DashboardBudgetTimelinePoint {
  return {
    key,
    label,
    approved: emptyCountCents(),
    rejected: emptyCountCents(),
    open: emptyCountCents(),
  };
}

export function summarizeBudgetAnalysisStatus(
  rows: readonly DashboardBudgetAnalysisRow[],
): {
  open: DashboardBudgetCountCents;
  approved: DashboardBudgetCountCents;
  rejected: DashboardBudgetCountCents;
  totalCount: number;
  approvalRate: number;
} {
  const summary = {
    open: emptyCountCents(),
    approved: emptyCountCents(),
    rejected: emptyCountCents(),
  };
  for (const row of rows) {
    summary[row.status].count += 1;
    summary[row.status].totalCents += row.valueCents;
  }
  const totalCount =
    summary.open.count + summary.approved.count + summary.rejected.count;
  const approvalRate =
    totalCount > 0
      ? Math.round((summary.approved.count / totalCount) * 1000) / 10
      : 0;
  return { ...summary, totalCount, approvalRate };
}

export function buildBudgetAnalysisTimeline(input: {
  rows: readonly DashboardBudgetAnalysisRow[];
  periodMode: DashboardBudgetPeriodMode;
  year: number;
  month?: number;
}): DashboardBudgetTimelinePoint[] {
  const { rows, periodMode, year, month } = input;

  if (periodMode === 'annual') {
    const points = Array.from({ length: 12 }, (_, index) => {
      const m = index + 1;
      const key = `${year}-${String(m).padStart(2, '0')}`;
      return emptyTimelinePoint(key, MONTH_ABBREVIATIONS[index] ?? String(m));
    });
    const byKey = new Map(points.map((p) => [p.key, p]));
    for (const row of rows) {
      const key = row.budgetDate.slice(0, 7);
      const point = byKey.get(key);
      if (!point) continue;
      point[row.status].count += 1;
      point[row.status].totalCents += row.valueCents;
    }
    return points;
  }

  const m = month ?? 1;
  const days = new Date(year, m, 0).getDate();
  const prefix = `${year}-${String(m).padStart(2, '0')}`;
  const points = Array.from({ length: days }, (_, index) => {
    const day = index + 1;
    const key = `${prefix}-${String(day).padStart(2, '0')}`;
    return emptyTimelinePoint(key, String(day));
  });
  const byKey = new Map(points.map((p) => [p.key, p]));
  for (const row of rows) {
    const point = byKey.get(row.budgetDate);
    if (!point) continue;
    point[row.status].count += 1;
    point[row.status].totalCents += row.valueCents;
  }
  return points;
}

export function toBudgetAnalysisRow(
  budget: Budget,
  items: readonly BudgetItem[],
  patientName: string,
  dimensionHints?: {
    planId?: string;
    planName?: string;
    treatmentId?: string;
    treatmentName?: string;
  },
): DashboardBudgetAnalysisRow | null {
  const status = mapBudgetStatusToUi(budget.status);
  if (!status) return null;

  const first = items[0];
  return {
    id: budget.id,
    budgetDate: formatDateOnly(budget.date),
    patientId: budget.patientId,
    patientName,
    description: budget.description,
    status,
    valueCents: budget.finalValueCents,
    professionalId: budget.responsibleId,
    professionalName: budget.responsibleName,
    planId: dimensionHints?.planId ?? first?.planId ?? '',
    planName: dimensionHints?.planName ?? first?.planName ?? '',
    treatmentId: dimensionHints?.treatmentId ?? first?.treatmentId ?? '',
    treatmentName:
      dimensionHints?.treatmentName ?? first?.treatmentName ?? '',
  };
}

export function aggregateBudgetAnalysis(input: {
  rows: readonly {
    budget: Budget;
    items: readonly BudgetItem[];
    patientName: string;
  }[];
  status: DashboardBudgetUiStatus;
  dimension: DashboardBudgetAnalysisDimension;
}): DashboardBudgetAnalysisAggregate[] {
  const { rows, status, dimension } = input;
  const filtered = rows.filter((row) => {
    const ui = mapBudgetStatusToUi(row.budget.status);
    return ui === status;
  });

  if (dimension === 'professionals') {
    const map = new Map<string, DashboardBudgetAnalysisAggregate>();
    for (const row of filtered) {
      const key = row.budget.responsibleId || 'uninformed';
      const name = row.budget.responsibleName || 'Não informado';
      const current = map.get(key) ?? { key, name, count: 0, totalCents: 0 };
      map.set(key, {
        ...current,
        count: current.count + 1,
        totalCents: current.totalCents + row.budget.finalValueCents,
      });
    }
    return [...map.values()].sort((a, b) => b.totalCents - a.totalCents);
  }

  const map = new Map<
    string,
    DashboardBudgetAnalysisAggregate & { budgetIds: Set<string> }
  >();

  for (const row of filtered) {
    for (const item of row.items) {
      const key =
        dimension === 'plans'
          ? item.planId || 'uninformed'
          : item.treatmentId || 'uninformed';
      const name =
        dimension === 'plans'
          ? item.planName || 'Não informado'
          : item.treatmentName || 'Não informado';
      const current = map.get(key) ?? {
        key,
        name,
        count: 0,
        totalCents: 0,
        budgetIds: new Set<string>(),
      };
      current.budgetIds.add(row.budget.id);
      current.totalCents += item.valueCents;
      map.set(key, current);
    }
  }

  return [...map.values()]
    .map(({ budgetIds, ...rest }) => ({
      ...rest,
      count: budgetIds.size,
    }))
    .sort((a, b) => b.totalCents - a.totalCents);
}

export function matchesPatientSearch(
  patientName: string,
  search?: string,
): boolean {
  const query = search?.trim();
  if (!query) return true;
  const normalize = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  return normalize(patientName).includes(normalize(query));
}

export function filterBudgetAnalysisDetails(input: {
  rows: readonly {
    budget: Budget;
    items: readonly BudgetItem[];
    patientName: string;
  }[];
  status: DashboardBudgetUiStatus;
  dimension?: DashboardBudgetAnalysisDimension;
  dimensionKey?: string;
  search?: string;
}): DashboardBudgetAnalysisRow[] {
  const { rows, status, dimension, dimensionKey, search } = input;
  const result: DashboardBudgetAnalysisRow[] = [];

  for (const row of rows) {
    if (!matchesPatientSearch(row.patientName, search)) continue;
    const ui = mapBudgetStatusToUi(row.budget.status);
    if (ui !== status) continue;

    if (!dimension || !dimensionKey) {
      const mapped = toBudgetAnalysisRow(row.budget, row.items, row.patientName);
      if (mapped) result.push(mapped);
      continue;
    }

    if (dimension === 'professionals') {
      const key = row.budget.responsibleId || 'uninformed';
      if (key !== dimensionKey) continue;
      const mapped = toBudgetAnalysisRow(row.budget, row.items, row.patientName);
      if (mapped) result.push(mapped);
      continue;
    }

    const matchingItems = row.items.filter((item) => {
      const key =
        dimension === 'plans'
          ? item.planId || 'uninformed'
          : item.treatmentId || 'uninformed';
      return key === dimensionKey;
    });
    if (matchingItems.length === 0) continue;

    const hintItem = matchingItems[0];
    const mapped = toBudgetAnalysisRow(row.budget, row.items, row.patientName, {
      planId: hintItem?.planId,
      planName: hintItem?.planName,
      treatmentId: hintItem?.treatmentId,
      treatmentName: hintItem?.treatmentName,
    });
    if (mapped) result.push(mapped);
  }

  return result.sort((a, b) => b.budgetDate.localeCompare(a.budgetDate));
}
