import { clinicaFetch } from '@/features/clinic/shared/api';
import {
  toPatientContractEmission,
  toPatientContractEmissionSummary,
  toUpsertPatientContractEmissionBody,
} from '../lib/patient-documents-api-mappers';
import type { PatientContractEmissionFormValues, PatientContractEmissionRecord } from '../types/patient-contract-emission';
import type {
  PatientContractEmissionApiDetail,
  PatientContractEmissionApiSummary,
  PatientContractEmissionListParams,
  PatientDocumentsListMeta,
  UpsertPatientContractEmissionBody,
} from '../types/patient-documents-api';

type ContractDetailEnvelope = { data: PatientContractEmissionApiDetail };
type ContractListEnvelope = {
  data: PatientContractEmissionApiSummary[];
  meta: PatientDocumentsListMeta;
};

function buildListQuery(params: PatientContractEmissionListParams): string {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.perPage !== undefined) searchParams.set('perPage', String(params.perPage));
  if (params.search?.trim()) searchParams.set('search', params.search.trim());
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export async function listPatientContractEmissions(
  storeId: string,
  patientId: string,
  params: PatientContractEmissionListParams = {},
): Promise<{ items: PatientContractEmissionRecord[]; meta: PatientDocumentsListMeta }> {
  const res = await clinicaFetch<ContractListEnvelope>(
    storeId,
    `/v1/patients/${patientId}/contracts${buildListQuery(params)}`,
  );

  return {
    items: res.data.map(toPatientContractEmissionSummary),
    meta: res.meta,
  };
}

export async function getPatientContractEmissionById(
  storeId: string,
  patientId: string,
  contractId: string,
): Promise<PatientContractEmissionRecord> {
  const res = await clinicaFetch<ContractDetailEnvelope>(
    storeId,
    `/v1/patients/${patientId}/contracts/${contractId}`,
  );

  return toPatientContractEmission(res.data);
}

export async function createPatientContractEmission(
  storeId: string,
  patientId: string,
  values: PatientContractEmissionFormValues,
  responsibleName: string,
  budgetId?: string | null,
): Promise<PatientContractEmissionRecord> {
  const body: UpsertPatientContractEmissionBody = toUpsertPatientContractEmissionBody(
    values,
    responsibleName,
    budgetId,
  );

  const res = await clinicaFetch<ContractDetailEnvelope>(
    storeId,
    `/v1/patients/${patientId}/contracts`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  );

  return toPatientContractEmission(res.data);
}

export async function updatePatientContractEmission(
  storeId: string,
  patientId: string,
  contractId: string,
  values: PatientContractEmissionFormValues,
  responsibleName: string,
): Promise<PatientContractEmissionRecord> {
  const body: UpsertPatientContractEmissionBody = toUpsertPatientContractEmissionBody(
    values,
    responsibleName,
  );

  const res = await clinicaFetch<ContractDetailEnvelope>(
    storeId,
    `/v1/patients/${patientId}/contracts/${contractId}`,
    {
      method: 'PUT',
      body: JSON.stringify(body),
    },
  );

  return toPatientContractEmission(res.data);
}

export async function deletePatientContractEmission(
  storeId: string,
  patientId: string,
  contractId: string,
): Promise<void> {
  await clinicaFetch<void>(
    storeId,
    `/v1/patients/${patientId}/contracts/${contractId}`,
    { method: 'DELETE' },
  );
}
