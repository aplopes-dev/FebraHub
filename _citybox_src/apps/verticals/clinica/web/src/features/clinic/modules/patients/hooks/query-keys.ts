import type { PatientListParams } from '../types/patient-api';
import type { PatientBudgetListParams } from '../types/patient-budget-api';
import type { PatientAnamnesisListParams } from '../types/patient-anamnesis-api';
import type { PatientFinancialEntryListParams } from '../types/patient-financial-entry-api';
import type {
  PatientCertificateListParams,
  PatientContractEmissionListParams,
  PatientPrescriptionListParams,
} from '../types/patient-documents-api';

export const patientKeys = {
  all: (storeId: string) => ['clinic', 'patients', storeId] as const,
  lists: (storeId: string) => [...patientKeys.all(storeId), 'list'] as const,
  list: (storeId: string, params: PatientListParams) =>
    [...patientKeys.lists(storeId), params] as const,
  details: (storeId: string) => [...patientKeys.all(storeId), 'detail'] as const,
  detail: (storeId: string, patientId: string) =>
    [...patientKeys.details(storeId), patientId] as const,
  categories: (storeId: string) => [...patientKeys.all(storeId), 'categories'] as const,
  referralOrigins: (storeId: string) =>
    [...patientKeys.all(storeId), 'referral-origins'] as const,
  externalProfessionals: (storeId: string) =>
    [...patientKeys.all(storeId), 'external-professionals'] as const,
};

export const budgetKeys = {
  all: (storeId: string, patientId: string) =>
    [...patientKeys.detail(storeId, patientId), 'budgets'] as const,
  lists: (storeId: string, patientId: string) =>
    [...budgetKeys.all(storeId, patientId), 'list'] as const,
  list: (storeId: string, patientId: string, params: PatientBudgetListParams) =>
    [...budgetKeys.lists(storeId, patientId), params] as const,
  detail: (storeId: string, patientId: string, budgetId: string) =>
    [...budgetKeys.all(storeId, patientId), 'detail', budgetId] as const,
};

export const treatmentKeys = {
  all: (storeId: string, patientId: string) =>
    [...patientKeys.detail(storeId, patientId), 'treatments'] as const,
  list: (storeId: string, patientId: string) =>
    [...treatmentKeys.all(storeId, patientId), 'list'] as const,
  nutritionInits: (storeId: string, patientId: string) =>
    [...treatmentKeys.all(storeId, patientId), 'nutrition-inits'] as const,
  nutritionInit: (storeId: string, patientId: string, evolutionId: string) =>
    [
      ...treatmentKeys.all(storeId, patientId),
      'nutrition-init',
      evolutionId,
    ] as const,
  nutritionNotes: (storeId: string, patientId: string, evolutionId: string) =>
    [
      ...treatmentKeys.all(storeId, patientId),
      'nutrition-notes',
      evolutionId,
    ] as const,
};

export const evolutionKeys = {
  all: (storeId: string, patientId: string) =>
    [...patientKeys.detail(storeId, patientId), 'evolutions'] as const,
  list: (storeId: string, patientId: string) =>
    [...evolutionKeys.all(storeId, patientId), 'list'] as const,
  history: (storeId: string, patientId: string, evolutionId: string) =>
    [...evolutionKeys.all(storeId, patientId), 'history', evolutionId] as const,
};

export const anamnesisKeys = {
  all: (storeId: string, patientId: string) =>
    [...patientKeys.detail(storeId, patientId), 'anamneses'] as const,
  lists: (storeId: string, patientId: string) =>
    [...anamnesisKeys.all(storeId, patientId), 'list'] as const,
  list: (storeId: string, patientId: string, params: PatientAnamnesisListParams) =>
    [...anamnesisKeys.lists(storeId, patientId), params] as const,
  detail: (storeId: string, patientId: string, anamnesisId: string) =>
    [...anamnesisKeys.all(storeId, patientId), 'detail', anamnesisId] as const,
  alerts: (storeId: string, patientId: string) =>
    [...anamnesisKeys.all(storeId, patientId), 'alerts'] as const,
};

export const patientFileKeys = {
  all: (storeId: string, patientId: string) =>
    [...patientKeys.detail(storeId, patientId), 'files'] as const,
  drive: (storeId: string, patientId: string, folderId: string | null, search: string) =>
    [...patientFileKeys.all(storeId, patientId), 'drive', folderId, search] as const,
  breadcrumb: (storeId: string, patientId: string, folderId: string | null) =>
    [...patientFileKeys.all(storeId, patientId), 'breadcrumb', folderId] as const,
  moveDestinations: (
    storeId: string,
    patientId: string,
    excludeFolderSubtreeId: string | null,
  ) =>
    [
      ...patientFileKeys.all(storeId, patientId),
      'move-destinations',
      excludeFolderSubtreeId,
    ] as const,
};

export const financialEntryKeys = {
  all: (storeId: string, patientId: string) =>
    [...patientKeys.detail(storeId, patientId), 'financial-entries'] as const,
  lists: (storeId: string, patientId: string) =>
    [...financialEntryKeys.all(storeId, patientId), 'list'] as const,
  list: (storeId: string, patientId: string, params: PatientFinancialEntryListParams) =>
    [...financialEntryKeys.lists(storeId, patientId), params] as const,
  detail: (storeId: string, patientId: string, entryId: string) =>
    [...financialEntryKeys.all(storeId, patientId), 'detail', entryId] as const,
};

export const contractEmissionKeys = {
  all: (storeId: string, patientId: string) =>
    [...patientKeys.detail(storeId, patientId), 'contract-emissions'] as const,
  lists: (storeId: string, patientId: string) =>
    [...contractEmissionKeys.all(storeId, patientId), 'list'] as const,
  list: (storeId: string, patientId: string, params: PatientContractEmissionListParams) =>
    [...contractEmissionKeys.lists(storeId, patientId), params] as const,
  detail: (storeId: string, patientId: string, contractId: string) =>
    [...contractEmissionKeys.all(storeId, patientId), 'detail', contractId] as const,
};

export const prescriptionKeys = {
  all: (storeId: string, patientId: string) =>
    [...patientKeys.detail(storeId, patientId), 'prescriptions'] as const,
  lists: (storeId: string, patientId: string) =>
    [...prescriptionKeys.all(storeId, patientId), 'list'] as const,
  list: (storeId: string, patientId: string, params: PatientPrescriptionListParams) =>
    [...prescriptionKeys.lists(storeId, patientId), params] as const,
  detail: (storeId: string, patientId: string, prescriptionId: string) =>
    [...prescriptionKeys.all(storeId, patientId), 'detail', prescriptionId] as const,
};

export const certificateKeys = {
  all: (storeId: string, patientId: string) =>
    [...patientKeys.detail(storeId, patientId), 'certificates'] as const,
  lists: (storeId: string, patientId: string) =>
    [...certificateKeys.all(storeId, patientId), 'list'] as const,
  list: (storeId: string, patientId: string, params: PatientCertificateListParams) =>
    [...certificateKeys.lists(storeId, patientId), params] as const,
  detail: (storeId: string, patientId: string, certificateId: string) =>
    [...certificateKeys.all(storeId, patientId), 'detail', certificateId] as const,
};

export type PatientPendingSignaturesListParams = {
  status?: 'pending' | 'signed' | 'refused' | 'cancelled' | 'expired';
  page?: number;
  perPage?: number;
};

export const patientSignatureKeys = {
  all: (storeId: string, patientId: string) =>
    [...patientKeys.detail(storeId, patientId), 'signatures'] as const,
  lists: (storeId: string, patientId: string) =>
    [...patientSignatureKeys.all(storeId, patientId), 'list'] as const,
  list: (
    storeId: string,
    patientId: string,
    params: PatientPendingSignaturesListParams,
  ) => [...patientSignatureKeys.lists(storeId, patientId), params] as const,
};

export const toothAnnotationKeys = {
  all: (storeId: string, patientId: string) =>
    [...patientKeys.detail(storeId, patientId), 'tooth-annotations'] as const,
  list: (storeId: string, patientId: string) =>
    [...toothAnnotationKeys.all(storeId, patientId), 'list'] as const,
};

export const bodyRegionAnnotationKeys = {
  all: (storeId: string, patientId: string) =>
    [...patientKeys.detail(storeId, patientId), 'body-region-annotations'] as const,
  list: (storeId: string, patientId: string) =>
    [...bodyRegionAnnotationKeys.all(storeId, patientId), 'list'] as const,
};

export type PatientBodyMetricListParams = {
  page: number;
  perPage: number;
};

export const bodyMetricKeys = {
  all: (storeId: string, patientId: string) =>
    [...patientKeys.detail(storeId, patientId), 'body-metrics'] as const,
  lists: (storeId: string, patientId: string) =>
    [...bodyMetricKeys.all(storeId, patientId), 'list'] as const,
  list: (storeId: string, patientId: string, params: PatientBodyMetricListParams) =>
    [...bodyMetricKeys.lists(storeId, patientId), params] as const,
};

export type PatientAppointmentListParams = {
  page: number;
  perPage: number;
};

export const patientAppointmentKeys = {
  all: (storeId: string, patientId: string) =>
    [...patientKeys.detail(storeId, patientId), 'appointments'] as const,
  lists: (storeId: string, patientId: string) =>
    [...patientAppointmentKeys.all(storeId, patientId), 'list'] as const,
  list: (storeId: string, patientId: string, params: PatientAppointmentListParams) =>
    [...patientAppointmentKeys.lists(storeId, patientId), params] as const,
};
