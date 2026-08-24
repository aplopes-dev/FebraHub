import type { PatientAnamnesis } from '../types/patient-anamnesis';
import type { PatientAnamnesisListParams } from '../types/patient-anamnesis-api';

export type PatientAnamnesisSortColumn = 'issuedAt' | 'templateName';

export type PatientAnamnesisSort = {
  column: PatientAnamnesisSortColumn;
  desc: boolean;
};

export function getNextPatientAnamnesisSort(
  current: PatientAnamnesisSort | null,
  column: PatientAnamnesisSortColumn,
): PatientAnamnesisSort {
  if (current?.column !== column) {
    return { column, desc: false };
  }

  return { column, desc: !current.desc };
}

const API_SORT_BY: Record<
  PatientAnamnesisSortColumn,
  NonNullable<PatientAnamnesisListParams['sortBy']>
> = {
  issuedAt: 'issuedAt',
  templateName: 'templateName',
};

export function toApiAnamnesisSort(
  sort: PatientAnamnesisSort | null,
): Pick<PatientAnamnesisListParams, 'sortBy' | 'sortOrder'> {
  if (!sort) {
    return { sortBy: 'issuedAt', sortOrder: 'desc' };
  }

  return {
    sortBy: API_SORT_BY[sort.column],
    sortOrder: sort.desc ? 'desc' : 'asc',
  };
}
