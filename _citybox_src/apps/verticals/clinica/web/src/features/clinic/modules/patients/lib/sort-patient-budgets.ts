import type { PatientBudgetListParams } from '../types/patient-budget-api';

export type PatientBudgetSortColumn = 'date' | 'description' | 'finalValue' | 'status';

export type PatientBudgetSort = {
  column: PatientBudgetSortColumn;
  desc: boolean;
};

export function getNextPatientBudgetSort(
  current: PatientBudgetSort | null,
  column: PatientBudgetSortColumn,
): PatientBudgetSort {
  if (current?.column !== column) {
    return { column, desc: false };
  }

  return { column, desc: !current.desc };
}

const API_SORT_BY: Record<PatientBudgetSortColumn, NonNullable<PatientBudgetListParams['sortBy']>> = {
  date: 'date',
  description: 'description',
  finalValue: 'finalValueCents',
  status: 'status',
};

export function toApiBudgetSort(
  sort: PatientBudgetSort | null,
): Pick<PatientBudgetListParams, 'sortBy' | 'sortOrder'> {
  if (!sort) {
    return {};
  }

  return {
    sortBy: API_SORT_BY[sort.column],
    sortOrder: sort.desc ? 'desc' : 'asc',
  };
}
