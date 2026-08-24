import type { PatientFinancialEntry } from '../types/patient-financial-entry';

import type { PatientFinancialEntryListParams } from '../types/patient-financial-entry-api';

export type PatientFinancialSortColumn = 'date' | 'name' | 'value';

export type PatientFinancialSort = {
  column: PatientFinancialSortColumn;
  desc: boolean;
};

const API_SORT_BY: Record<
  PatientFinancialSortColumn,
  NonNullable<PatientFinancialEntryListParams['sortBy']>
> = {
  date: 'date',
  name: 'name',
  value: 'valueCents',
};

export function toApiFinancialSort(
  sort: PatientFinancialSort | null,
): Pick<PatientFinancialEntryListParams, 'sortBy' | 'sortOrder'> {
  if (!sort) {
    return { sortBy: 'date', sortOrder: 'desc' };
  }

  return {
    sortBy: API_SORT_BY[sort.column],
    sortOrder: sort.desc ? 'desc' : 'asc',
  };
}

function compareFinancialEntries(
  left: PatientFinancialEntry,
  right: PatientFinancialEntry,
  column: PatientFinancialSortColumn,
): number {
  switch (column) {
    case 'date':
      return left.date.localeCompare(right.date);
    case 'name':
      return left.name.localeCompare(right.name, 'pt-BR');
    case 'value':
      return left.valueCents - right.valueCents;
    default:
      return 0;
  }
}

export function sortPatientFinancialEntries(
  entries: PatientFinancialEntry[],
  sort: PatientFinancialSort | null,
): PatientFinancialEntry[] {
  if (!sort) return entries;

  const sorted = [...entries].sort((left, right) =>
    compareFinancialEntries(left, right, sort.column),
  );
  return sort.desc ? sorted.reverse() : sorted;
}

export function getNextPatientFinancialSort(
  current: PatientFinancialSort | null,
  column: PatientFinancialSortColumn,
): PatientFinancialSort {
  if (current?.column !== column) {
    return { column, desc: false };
  }

  return { column, desc: !current.desc };
}
