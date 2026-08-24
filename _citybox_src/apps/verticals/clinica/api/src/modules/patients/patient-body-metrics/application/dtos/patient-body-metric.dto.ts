import type { PatientBodyMetricListSortBy } from '../../domain/repositories/patient-body-metric.repository.interface';

export type UpsertPatientBodyMetricInput = {
  measuredAt: string;
  weightKg: number;
  heightCm: number;
  professionalId?: string;
  professionalName: string;
  notes?: string;
};

export interface CreatePatientBodyMetricDto {
  storeId: string;
  patientId: string;
  input: UpsertPatientBodyMetricInput;
}

export interface ListPatientBodyMetricsDto {
  storeId: string;
  patientId: string;
  page?: number;
  perPage?: number;
  sortBy?: PatientBodyMetricListSortBy;
  sortOrder?: 'asc' | 'desc';
}

export type ListPatientBodyMetricsResult = {
  items: import('../../domain/entities/patient-body-metric.entity').PatientBodyMetric[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export function parseMeasuredAt(measuredAt: string): Date {
  const parsed = new Date(`${measuredAt.trim()}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid measuredAt: ${measuredAt}`);
  }
  return parsed;
}
