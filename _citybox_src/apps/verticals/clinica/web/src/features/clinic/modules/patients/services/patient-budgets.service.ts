import { clinicaFetch } from '@/features/clinic/shared/api';
import {
  mapUiBudgetStatusToApi,
  toPatientBudget,
  toPatientBudgetDuplicateBody,
  toPatientBudgetSummary,
  toPatientBudgetUpsertBody,
} from '../lib/patient-budget-api-mappers';
import type { PatientBudget, PatientBudgetStatus } from '../types/patient-budget';
import type { PatientBudgetSheetSubmitPayload } from '../types/patient-budget-form';
import type { PatientBudgetApiDetail, PatientBudgetApiSummary, PatientBudgetListMeta, PatientBudgetListParams } from '../types/patient-budget-api';

type BudgetDetailEnvelope = { data: PatientBudgetApiDetail };
type BudgetListEnvelope = {
  data: PatientBudgetApiSummary[];
  meta: PatientBudgetListMeta;
};

function buildBudgetListQuery(params: PatientBudgetListParams): string {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.perPage !== undefined) searchParams.set('perPage', String(params.perPage));
  if (params.search?.trim()) searchParams.set('search', params.search.trim());
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export async function listPatientBudgets(
  storeId: string,
  patientId: string,
  params: PatientBudgetListParams = {},
): Promise<{ items: PatientBudget[]; meta: PatientBudgetListMeta }> {
  const res = await clinicaFetch<BudgetListEnvelope>(
    storeId,
    `/v1/patients/${patientId}/budgets${buildBudgetListQuery(params)}`,
  );

  return {
    items: res.data.map(toPatientBudgetSummary),
    meta: res.meta,
  };
}

export async function getPatientBudgetById(
  storeId: string,
  patientId: string,
  budgetId: string,
): Promise<PatientBudget> {
  const res = await clinicaFetch<BudgetDetailEnvelope>(
    storeId,
    `/v1/patients/${patientId}/budgets/${budgetId}`,
  );

  return toPatientBudget(res.data);
}

export async function createPatientBudget(
  storeId: string,
  patientId: string,
  payload: PatientBudgetSheetSubmitPayload,
): Promise<PatientBudget> {
  const res = await clinicaFetch<BudgetDetailEnvelope>(
    storeId,
    `/v1/patients/${patientId}/budgets`,
    {
      method: 'POST',
      body: JSON.stringify(toPatientBudgetUpsertBody(payload)),
    },
  );

  return toPatientBudget(res.data);
}

export async function updatePatientBudget(
  storeId: string,
  patientId: string,
  budgetId: string,
  payload: PatientBudgetSheetSubmitPayload,
): Promise<PatientBudget> {
  const res = await clinicaFetch<BudgetDetailEnvelope>(
    storeId,
    `/v1/patients/${patientId}/budgets/${budgetId}`,
    {
      method: 'PUT',
      body: JSON.stringify(toPatientBudgetUpsertBody(payload)),
    },
  );

  return toPatientBudget(res.data);
}

export async function deletePatientBudget(
  storeId: string,
  patientId: string,
  budgetId: string,
): Promise<void> {
  await clinicaFetch<void>(storeId, `/v1/patients/${patientId}/budgets/${budgetId}`, {
    method: 'DELETE',
  });
}

export async function duplicatePatientBudget(
  storeId: string,
  patientId: string,
  budgetId: string,
  description: string,
): Promise<PatientBudget> {
  const detailRes = await clinicaFetch<BudgetDetailEnvelope>(
    storeId,
    `/v1/patients/${patientId}/budgets/${budgetId}`,
  );

  const res = await clinicaFetch<BudgetDetailEnvelope>(
    storeId,
    `/v1/patients/${patientId}/budgets`,
    {
      method: 'POST',
      body: JSON.stringify(toPatientBudgetDuplicateBody(detailRes.data, description)),
    },
  );

  return toPatientBudget(res.data);
}

export async function updatePatientBudgetStatus(
  storeId: string,
  patientId: string,
  budgetId: string,
  status: PatientBudgetStatus,
  rejection?: { date: string; reason: string } | null,
  dueDate?: string,
  installments?: Array<{ dueDate: string; valueCents: number }>,
): Promise<PatientBudget> {
  const apiStatus = mapUiBudgetStatusToApi(status);
  const body: {
    status: ReturnType<typeof mapUiBudgetStatusToApi>;
    rejectedAt?: string;
    rejectionReason?: string;
    dueDate?: string;
    installments?: Array<{ dueDate: string; valueCents: number }>;
  } = { status: apiStatus };

  if (apiStatus === 'rejected' && rejection) {
    body.rejectedAt = rejection.date;
    body.rejectionReason = rejection.reason;
  }

  if (apiStatus === 'approved' && dueDate) {
    body.dueDate = dueDate;
  }

  if (apiStatus === 'approved' && installments && installments.length > 0) {
    body.installments = installments;
  }

  const res = await clinicaFetch<BudgetDetailEnvelope>(
    storeId,
    `/v1/patients/${patientId}/budgets/${budgetId}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    },
  );

  return toPatientBudget(res.data);
}

export async function approvePatientBudget(
  storeId: string,
  patientId: string,
  budgetId: string,
  dueDate?: string,
  installments?: Array<{ dueDate: string; valueCents: number }>,
): Promise<PatientBudget> {
  return updatePatientBudgetStatus(
    storeId,
    patientId,
    budgetId,
    'approved',
    undefined,
    dueDate,
    installments,
  );
}
