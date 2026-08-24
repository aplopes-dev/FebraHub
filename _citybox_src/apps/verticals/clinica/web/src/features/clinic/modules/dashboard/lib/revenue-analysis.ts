import type {
  DashboardRevenueReceipt,
  DashboardRevenueSale,
  RevenueAggregateRow,
  RevenueAnalysisDimension,
  RevenueAnalysisMode,
  RevenueDetailRow,
  RevenuePeriodFilter,
} from '../types/clinic-dashboard';
import { parseLocalDateString } from './dashboard-dates';
import { resolveRevenuePeriodRange } from './revenue-analysis-period';

const DIMENSION_FIELD: Record<
  RevenueAnalysisDimension,
  {
    key: keyof DashboardRevenueSale;
    name: keyof DashboardRevenueSale;
  }
> = {
  professionals: { key: 'professionalId', name: 'professionalName' },
  plans: { key: 'planId', name: 'planName' },
  treatments: { key: 'treatmentId', name: 'treatmentName' },
  specialties: { key: 'specialtyId', name: 'specialtyName' },
};

export const REVENUE_DIMENSION_LABELS: Record<RevenueAnalysisDimension, string> =
  {
    professionals: 'profissionais',
    plans: 'planos',
    treatments: 'procedimentos',
    specialties: 'especialidades',
  };

type EnrichedRevenueRow = RevenueDetailRow & {
  dimensionKey: string;
  dimensionName: string;
};

export function isDateInRange(
  date: string,
  startDate: string,
  endDate: string,
): boolean {
  const value = parseLocalDateString(date);
  const start = parseLocalDateString(startDate);
  const end = parseLocalDateString(endDate);
  if (
    Number.isNaN(value.getTime()) ||
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return false;
  }
  return value >= start && value <= end;
}

function salesById(
  sales: DashboardRevenueSale[],
): Map<string, DashboardRevenueSale> {
  return new Map(sales.map((sale) => [sale.id, sale]));
}

function matchesDimension(
  sale: DashboardRevenueSale,
  dimension?: RevenueAnalysisDimension,
  dimensionKey?: string,
): boolean {
  if (!dimension || !dimensionKey) return true;
  return String(sale[DIMENSION_FIELD[dimension].key]) === dimensionKey;
}

function collectEnrichedRows(params: {
  mode: RevenueAnalysisMode;
  sales: DashboardRevenueSale[];
  receipts: DashboardRevenueReceipt[];
  period: RevenuePeriodFilter;
  referenceDate?: Date;
  customStart?: Date;
  customEnd?: Date;
  dimension: RevenueAnalysisDimension;
  dimensionKey?: string;
}): EnrichedRevenueRow[] {
  const range = resolveRevenuePeriodRange(
    params.period,
    params.referenceDate,
    params.customStart,
    params.customEnd,
  );
  const saleMap = salesById(params.sales);
  const fields = DIMENSION_FIELD[params.dimension];
  const rows: EnrichedRevenueRow[] = [];

  if (params.mode === 'receipts') {
    for (const receipt of params.receipts) {
      if (receipt.status !== 'paid') continue;
      if (!isDateInRange(receipt.paidAt, range.startDate, range.endDate)) {
        continue;
      }
      const sale = saleMap.get(receipt.saleId);
      if (!sale) continue;
      if (!matchesDimension(sale, params.dimension, params.dimensionKey)) {
        continue;
      }
      rows.push({
        id: receipt.id,
        date: receipt.paidAt,
        patientId: sale.patientId,
        patientName: sale.patientName,
        treatmentName: sale.treatmentName,
        valueCents: receipt.valueCents,
        dimensionKey: String(sale[fields.key]),
        dimensionName: String(sale[fields.name]),
      });
    }
  } else {
    for (const sale of params.sales) {
      if (!isDateInRange(sale.saleDate, range.startDate, range.endDate)) {
        continue;
      }
      if (!matchesDimension(sale, params.dimension, params.dimensionKey)) {
        continue;
      }
      rows.push({
        id: sale.id,
        date: sale.saleDate,
        patientId: sale.patientId,
        patientName: sale.patientName,
        treatmentName: sale.treatmentName,
        valueCents: sale.valueCents,
        dimensionKey: String(sale[fields.key]),
        dimensionName: String(sale[fields.name]),
      });
    }
  }

  return rows.sort((a, b) => b.date.localeCompare(a.date));
}

export function filterRevenueDetailRows(params: {
  mode: RevenueAnalysisMode;
  sales: DashboardRevenueSale[];
  receipts: DashboardRevenueReceipt[];
  period: RevenuePeriodFilter;
  referenceDate?: Date;
  customStart?: Date;
  customEnd?: Date;
  dimension?: RevenueAnalysisDimension;
  dimensionKey?: string;
  includeWithoutRevenue?: boolean;
}): RevenueDetailRow[] {
  const enriched = collectEnrichedRows({
    ...params,
    dimension: params.dimension ?? 'professionals',
  });

  return enriched.map(
    ({ id, date, patientId, patientName, treatmentName, valueCents }) => ({
      id,
      date,
      patientId,
      patientName,
      treatmentName,
      valueCents,
    }),
  );
}

function supportsIncludeWithoutRevenue(
  dimension: RevenueAnalysisDimension,
): boolean {
  return dimension === 'treatments' || dimension === 'specialties';
}

export function aggregateRevenueAnalysis(params: {
  mode: RevenueAnalysisMode;
  dimension: RevenueAnalysisDimension;
  sales: DashboardRevenueSale[];
  receipts: DashboardRevenueReceipt[];
  period: RevenuePeriodFilter;
  referenceDate?: Date;
  customStart?: Date;
  customEnd?: Date;
  includeWithoutRevenue?: boolean;
}): RevenueAggregateRow[] {
  const enriched = collectEnrichedRows(params);
  const buckets = new Map<string, RevenueAggregateRow>();
  const fields = DIMENSION_FIELD[params.dimension];

  for (const row of enriched) {
    const existing = buckets.get(row.dimensionKey);
    if (existing) {
      buckets.set(row.dimensionKey, {
        ...existing,
        count: existing.count + 1,
        totalCents: existing.totalCents + row.valueCents,
      });
    } else {
      buckets.set(row.dimensionKey, {
        key: row.dimensionKey,
        name: row.dimensionName,
        count: 1,
        totalCents: row.valueCents,
      });
    }
  }

  if (
    params.includeWithoutRevenue &&
    supportsIncludeWithoutRevenue(params.dimension)
  ) {
    const range = resolveRevenuePeriodRange(
      params.period,
      params.referenceDate,
      params.customStart,
      params.customEnd,
    );

    for (const sale of params.sales) {
      if (!isDateInRange(sale.saleDate, range.startDate, range.endDate)) {
        continue;
      }
      const key = String(sale[fields.key]);
      if (buckets.has(key)) continue;
      buckets.set(key, {
        key,
        name: String(sale[fields.name]),
        count: 0,
        totalCents: 0,
      });
    }
  }

  return [...buckets.values()].sort((a, b) => {
    if (b.totalCents !== a.totalCents) return b.totalCents - a.totalCents;
    return a.name.localeCompare(b.name, 'pt-BR');
  });
}

export function formatRevenueCountLabel(
  mode: RevenueAnalysisMode,
  count: number,
): string {
  if (mode === 'sales') {
    return count === 1 ? '1 procedimento' : `${count} procedimentos`;
  }
  return count === 1 ? '1 receita' : `${count} receitas`;
}

export function formatRevenueValueLabel(mode: RevenueAnalysisMode): string {
  return mode === 'receipts' ? 'Receitas' : 'Vendas';
}

export function formatDimensionCountLabel(
  dimension: RevenueAnalysisDimension,
  count: number,
): string {
  const label = REVENUE_DIMENSION_LABELS[dimension];
  return `${count} ${label}`;
}
