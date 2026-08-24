import type {
  DashboardRevenueAggregateRow,
  DashboardRevenueDetailRow,
  DashboardRevenueDimension,
  DashboardRevenueLine,
} from './dashboard-revenue.types';
import {
  UNINFORMED_DIMENSION_KEY,
  UNINFORMED_DIMENSION_NAME,
} from './dashboard-revenue.types';

type DimensionFields = {
  key: keyof DashboardRevenueLine;
  name: keyof DashboardRevenueLine;
};

const DIMENSION_FIELD: Record<DashboardRevenueDimension, DimensionFields> = {
  professionals: { key: 'professionalId', name: 'professionalName' },
  plans: { key: 'planId', name: 'planName' },
  treatments: { key: 'treatmentId', name: 'treatmentName' },
  specialties: { key: 'specialtyId', name: 'specialtyName' },
};

export function resolveDimensionKey(
  line: DashboardRevenueLine,
  dimension: DashboardRevenueDimension,
): { key: string; name: string } {
  const fields = DIMENSION_FIELD[dimension];
  const rawKey = String(line[fields.key] ?? '').trim();
  const rawName = String(line[fields.name] ?? '').trim();
  if (!rawKey) {
    return {
      key: UNINFORMED_DIMENSION_KEY,
      name: UNINFORMED_DIMENSION_NAME,
    };
  }
  return { key: rawKey, name: rawName || UNINFORMED_DIMENSION_NAME };
}

export function filterLinesByDimension(
  lines: DashboardRevenueLine[],
  dimension: DashboardRevenueDimension,
  dimensionKey?: string,
): DashboardRevenueLine[] {
  if (!dimensionKey) return lines;
  return lines.filter(
    (line) => resolveDimensionKey(line, dimension).key === dimensionKey,
  );
}

export function aggregateRevenueLines(
  lines: DashboardRevenueLine[],
  dimension: DashboardRevenueDimension,
): DashboardRevenueAggregateRow[] {
  const buckets = new Map<string, DashboardRevenueAggregateRow>();

  for (const line of lines) {
    const { key, name } = resolveDimensionKey(line, dimension);
    // Lines without the dimension attribute (e.g. manual cash entries) must
    // not surface as an "uninformed" bucket repeated across every tab.
    if (key === UNINFORMED_DIMENSION_KEY) continue;
    const existing = buckets.get(key);
    if (existing) {
      buckets.set(key, {
        ...existing,
        count: existing.count + 1,
        totalCents: existing.totalCents + line.valueCents,
      });
    } else {
      buckets.set(key, {
        key,
        name,
        count: 1,
        totalCents: line.valueCents,
      });
    }
  }

  return [...buckets.values()].sort((a, b) => {
    if (b.totalCents !== a.totalCents) return b.totalCents - a.totalCents;
    return a.name.localeCompare(b.name, 'pt-BR');
  });
}

/**
 * Merge zero-revenue dimension keys from `candidateLines` into aggregates
 * (used by includeWithoutRevenue for treatments/specialties in receipts mode).
 */
export function mergeZeroRevenueBuckets(
  aggregates: DashboardRevenueAggregateRow[],
  candidateLines: DashboardRevenueLine[],
  dimension: DashboardRevenueDimension,
): DashboardRevenueAggregateRow[] {
  if (dimension !== 'treatments' && dimension !== 'specialties') {
    return aggregates;
  }

  const buckets = new Map(aggregates.map((row) => [row.key, row]));
  for (const line of candidateLines) {
    const { key, name } = resolveDimensionKey(line, dimension);
    if (key === UNINFORMED_DIMENSION_KEY) continue;
    if (buckets.has(key)) continue;
    buckets.set(key, { key, name, count: 0, totalCents: 0 });
  }

  return [...buckets.values()].sort((a, b) => {
    if (b.totalCents !== a.totalCents) return b.totalCents - a.totalCents;
    return a.name.localeCompare(b.name, 'pt-BR');
  });
}

export function toDetailRows(
  lines: DashboardRevenueLine[],
): DashboardRevenueDetailRow[] {
  return lines
    .map((line) => ({
      id: line.id,
      date: line.date,
      patientId: line.patientId,
      patientName: line.patientName,
      treatmentName: line.treatmentName,
      valueCents: line.valueCents,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function matchesPatientSearch(
  line: DashboardRevenueLine,
  search?: string,
): boolean {
  const query = search?.trim().toLowerCase();
  if (!query) return true;
  return line.patientName.toLowerCase().includes(query);
}

/**
 * Allocate `totalCents` across item weights proportionally.
 * Remainder cents go to the last item so the sum matches exactly.
 */
export function allocateProportionally(
  totalCents: number,
  weights: number[],
): number[] {
  if (weights.length === 0) return [];
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  if (weightSum <= 0) {
    const even = Math.floor(totalCents / weights.length);
    const parts = weights.map(() => even);
    parts[parts.length - 1] += totalCents - even * weights.length;
    return parts;
  }

  const parts = weights.map((weight) =>
    Math.floor((totalCents * weight) / weightSum),
  );
  const allocated = parts.reduce((sum, part) => sum + part, 0);
  parts[parts.length - 1] += totalCents - allocated;
  return parts;
}

export function parseBrlValueToCents(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.round(value);
  }
  if (typeof value !== 'string') return 0;
  const normalized = value
    .trim()
    .replace(/[^\d,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) return 0;
  return Math.round(parsed * 100);
}
