import { clinicaFetch } from '@/features/clinic/shared/api';
import {
  toPatientPrescription,
  toPatientPrescriptionSummary,
  toUpsertPatientPrescriptionBody,
} from '../lib/patient-documents-api-mappers';
import type {
  PatientDocumentsListMeta,
  PatientPrescriptionApiDetail,
  PatientPrescriptionApiSummary,
  PatientPrescriptionListParams,
  UpsertPatientPrescriptionBody,
} from '../types/patient-documents-api';
import type { PatientPrescriptionFormValues, PatientPrescriptionRecord } from '../types/patient-prescription';
import type { ProfessionalCouncilSnapshot } from '../lib/professional-council';

type PrescriptionDetailEnvelope = { data: PatientPrescriptionApiDetail };
type PrescriptionListEnvelope = {
  data: PatientPrescriptionApiSummary[];
  meta: PatientDocumentsListMeta;
};

function buildListQuery(params: PatientPrescriptionListParams): string {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.perPage !== undefined) searchParams.set('perPage', String(params.perPage));
  if (params.search?.trim()) searchParams.set('search', params.search.trim());
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export async function listPatientPrescriptions(
  storeId: string,
  patientId: string,
  params: PatientPrescriptionListParams = {},
): Promise<{ items: PatientPrescriptionRecord[]; meta: PatientDocumentsListMeta }> {
  const res = await clinicaFetch<PrescriptionListEnvelope>(
    storeId,
    `/v1/patients/${patientId}/prescriptions${buildListQuery(params)}`,
  );

  return {
    items: res.data.map(toPatientPrescriptionSummary),
    meta: res.meta,
  };
}

export async function getPatientPrescriptionById(
  storeId: string,
  patientId: string,
  prescriptionId: string,
): Promise<PatientPrescriptionRecord> {
  const res = await clinicaFetch<PrescriptionDetailEnvelope>(
    storeId,
    `/v1/patients/${patientId}/prescriptions/${prescriptionId}`,
  );

  return toPatientPrescription(res.data);
}

export async function createPatientPrescription(
  storeId: string,
  patientId: string,
  values: PatientPrescriptionFormValues,
  professionalName: string,
  clinicName?: string,
  council?: ProfessionalCouncilSnapshot | null,
): Promise<PatientPrescriptionRecord> {
  const body: UpsertPatientPrescriptionBody = toUpsertPatientPrescriptionBody(
    values,
    professionalName,
    clinicName,
    council,
  );

  const res = await clinicaFetch<PrescriptionDetailEnvelope>(
    storeId,
    `/v1/patients/${patientId}/prescriptions`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  );

  return toPatientPrescription(res.data);
}

export async function updatePatientPrescription(
  storeId: string,
  patientId: string,
  prescriptionId: string,
  values: PatientPrescriptionFormValues,
  professionalName: string,
  clinicName?: string,
): Promise<PatientPrescriptionRecord> {
  const body: UpsertPatientPrescriptionBody = toUpsertPatientPrescriptionBody(
    values,
    professionalName,
    clinicName,
  );

  const res = await clinicaFetch<PrescriptionDetailEnvelope>(
    storeId,
    `/v1/patients/${patientId}/prescriptions/${prescriptionId}`,
    {
      method: 'PUT',
      body: JSON.stringify(body),
    },
  );

  return toPatientPrescription(res.data);
}

export async function deletePatientPrescription(
  storeId: string,
  patientId: string,
  prescriptionId: string,
): Promise<void> {
  await clinicaFetch<void>(
    storeId,
    `/v1/patients/${patientId}/prescriptions/${prescriptionId}`,
    { method: 'DELETE' },
  );
}
