export type DashboardRevenueMode = 'receipts' | 'sales';

export type DashboardRevenueDimension =
  | 'professionals'
  | 'plans'
  | 'treatments'
  | 'specialties';

export type DashboardRevenueSaleOrigin =
  | 'approved_budget'
  | 'treatment_in_progress'
  | 'manual_debit';

export const UNINFORMED_DIMENSION_KEY = 'uninformed';
export const UNINFORMED_DIMENSION_NAME = 'Não informado';

/** Canonical line used for aggregation and detail listing. */
export type DashboardRevenueLine = {
  id: string;
  date: string;
  patientId: string;
  patientName: string;
  treatmentName: string;
  valueCents: number;
  professionalId: string;
  professionalName: string;
  planId: string;
  planName: string;
  treatmentId: string;
  specialtyId: string;
  specialtyName: string;
  origin?: DashboardRevenueSaleOrigin;
};

export type DashboardRevenueAggregateRow = {
  key: string;
  name: string;
  count: number;
  totalCents: number;
};

export type DashboardRevenueDetailRow = {
  id: string;
  date: string;
  patientId: string;
  patientName: string;
  treatmentName: string;
  valueCents: number;
};

export type SpecialtyRef = {
  specialtyId: string;
  specialtyName: string;
  planName: string;
};
