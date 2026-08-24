import { clinicaFetch } from '@/features/clinic/shared/api';
import {
  toCreatePatientCertificateBody,
  toPatientCertificate,
} from '../lib/patient-documents-api-mappers';
import type { PatientCertificateFormValues, PatientCertificateRecord } from '../types/patient-certificate';
import type {
  CreatePatientCertificateBody,
  PatientCertificateApiRecord,
  PatientCertificateListParams,
  PatientDocumentsListMeta,
} from '../types/patient-documents-api';
import type { ProfessionalCouncilSnapshot } from '../lib/professional-council';

type CertificateDetailEnvelope = { data: PatientCertificateApiRecord };
type CertificateListEnvelope = {
  data: PatientCertificateApiRecord[];
  meta: PatientDocumentsListMeta;
};

function buildListQuery(params: PatientCertificateListParams): string {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.perPage !== undefined) searchParams.set('perPage', String(params.perPage));
  if (params.search?.trim()) searchParams.set('search', params.search.trim());
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export async function listPatientCertificates(
  storeId: string,
  patientId: string,
  params: PatientCertificateListParams = {},
): Promise<{ items: PatientCertificateRecord[]; meta: PatientDocumentsListMeta }> {
  const res = await clinicaFetch<CertificateListEnvelope>(
    storeId,
    `/v1/patients/${patientId}/certificates${buildListQuery(params)}`,
  );

  return {
    items: res.data.map(toPatientCertificate),
    meta: res.meta,
  };
}

export async function getPatientCertificateById(
  storeId: string,
  patientId: string,
  certificateId: string,
): Promise<PatientCertificateRecord> {
  const res = await clinicaFetch<CertificateDetailEnvelope>(
    storeId,
    `/v1/patients/${patientId}/certificates/${certificateId}`,
  );

  return toPatientCertificate(res.data);
}

export async function createPatientCertificate(
  storeId: string,
  patientId: string,
  values: PatientCertificateFormValues,
  professionalName: string,
  clinicName?: string,
  council?: ProfessionalCouncilSnapshot | null,
): Promise<PatientCertificateRecord> {
  const body: CreatePatientCertificateBody = toCreatePatientCertificateBody(
    values,
    professionalName,
    clinicName,
    council,
  );

  const res = await clinicaFetch<CertificateDetailEnvelope>(
    storeId,
    `/v1/patients/${patientId}/certificates`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  );

  return toPatientCertificate(res.data);
}

export async function deletePatientCertificate(
  storeId: string,
  patientId: string,
  certificateId: string,
): Promise<void> {
  await clinicaFetch<void>(
    storeId,
    `/v1/patients/${patientId}/certificates/${certificateId}`,
    { method: 'DELETE' },
  );
}
