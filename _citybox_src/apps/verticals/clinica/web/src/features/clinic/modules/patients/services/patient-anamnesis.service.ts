import { clinicaFetch } from '@/features/clinic/shared/api';
import {
  toCreatePatientAnamnesisBody,
  toPatientAnamnesis,
  toPatientAnamnesisSummary,
} from '../lib/patient-anamnesis-api-mappers';
import type { PatientAnamnesis, PatientAnamnesisAnswer } from '../types/patient-anamnesis';
import type {
  CreatePatientAnamnesisBody,
  PatientAnamnesisApiDetail,
  PatientAnamnesisApiSummary,
  PatientAnamnesisListMeta,
  PatientAnamnesisListParams,
} from '../types/patient-anamnesis-api';

type AnamnesisDetailEnvelope = { data: PatientAnamnesisApiDetail };
type AnamnesisListEnvelope = {
  data: PatientAnamnesisApiSummary[];
  meta: PatientAnamnesisListMeta;
};

function buildAnamnesisListQuery(params: PatientAnamnesisListParams): string {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.perPage !== undefined) searchParams.set('perPage', String(params.perPage));
  if (params.search?.trim()) searchParams.set('search', params.search.trim());
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export async function listPatientAnamneses(
  storeId: string,
  patientId: string,
  params: PatientAnamnesisListParams = {},
): Promise<{ items: PatientAnamnesis[]; meta: PatientAnamnesisListMeta }> {
  const res = await clinicaFetch<AnamnesisListEnvelope>(
    storeId,
    `/v1/patients/${patientId}/anamneses${buildAnamnesisListQuery(params)}`,
  );

  return {
    items: res.data.map(toPatientAnamnesisSummary),
    meta: res.meta,
  };
}

export async function getPatientAnamnesisById(
  storeId: string,
  patientId: string,
  anamnesisId: string,
): Promise<PatientAnamnesis> {
  const res = await clinicaFetch<AnamnesisDetailEnvelope>(
    storeId,
    `/v1/patients/${patientId}/anamneses/${anamnesisId}`,
  );

  return toPatientAnamnesis(res.data);
}

export async function createPatientAnamnesis(
  storeId: string,
  patientId: string,
  body: CreatePatientAnamnesisBody,
): Promise<PatientAnamnesis> {
  const res = await clinicaFetch<AnamnesisDetailEnvelope>(
    storeId,
    `/v1/patients/${patientId}/anamneses`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  );

  return toPatientAnamnesis(res.data);
}

export async function createPatientAnamnesisFromDraft(
  storeId: string,
  patientId: string,
  input: {
    templateId: string;
    fillingMode: PatientAnamnesis['fillingMode'];
    consultationReason?: string;
    answers?: Record<string, PatientAnamnesisAnswer>;
  },
): Promise<PatientAnamnesis> {
  return createPatientAnamnesis(
    storeId,
    patientId,
    toCreatePatientAnamnesisBody(input),
  );
}

export async function deletePatientAnamnesis(
  storeId: string,
  patientId: string,
  anamnesisId: string,
): Promise<void> {
  await clinicaFetch<void>(
    storeId,
    `/v1/patients/${patientId}/anamneses/${anamnesisId}`,
    { method: 'DELETE' },
  );
}
