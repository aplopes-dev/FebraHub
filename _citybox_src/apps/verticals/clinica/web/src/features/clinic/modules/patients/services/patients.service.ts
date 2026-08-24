import { clinicaFetch, clinicaUpload } from '@/features/clinic/shared/api';
import {
  toClinicPatient,
  toPatientFormValues,
  toPatientUpsertBody,
} from '../lib/patient-api-mappers';
import type { ClinicPatient } from '../types/clinic-patient';
import type { PatientFormValues } from '../types/patient-form';
import type {
  PatientApiFormItem,
  PatientApiListItem,
  PatientListMeta,
  PatientListParams,
} from '../types/patient-api';

type PatientListEnvelope = {
  data: PatientApiListItem[];
  meta: PatientListMeta;
};

type PatientFormEnvelope = { data: PatientApiFormItem };

function buildListQuery(params: PatientListParams): string {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.perPage !== undefined) searchParams.set('perPage', String(params.perPage));
  if (params.search?.trim()) searchParams.set('search', params.search.trim());
  if (params.categoryId) searchParams.set('categoryId', params.categoryId);
  if (params.status) searchParams.set('status', params.status);
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export async function listPatients(
  storeId: string,
  params: PatientListParams = {},
): Promise<{ items: ClinicPatient[]; meta: PatientListMeta }> {
  const res = await clinicaFetch<PatientListEnvelope>(
    storeId,
    `/v1/patients${buildListQuery(params)}`,
  );
  return {
    items: res.data.map((row) => toClinicPatient(row, storeId)),
    meta: res.meta,
  };
}

export async function getPatientById(
  storeId: string,
  patientId: string,
): Promise<{ patient: ClinicPatient; form: PatientFormValues }> {
  const res = await clinicaFetch<PatientFormEnvelope>(storeId, `/v1/patients/${patientId}`);
  return {
    patient: toClinicPatient(res.data, storeId),
    form: toPatientFormValues(res.data),
  };
}

export async function createPatient(
  storeId: string,
  values: PatientFormValues,
): Promise<{ patient: ClinicPatient; form: PatientFormValues }> {
  const res = await clinicaFetch<PatientFormEnvelope>(storeId, '/v1/patients', {
    method: 'POST',
    body: JSON.stringify(toPatientUpsertBody(values)),
  });
  return {
    patient: toClinicPatient(res.data, storeId),
    form: toPatientFormValues(res.data),
  };
}

export async function updatePatient(
  storeId: string,
  patientId: string,
  values: PatientFormValues,
): Promise<{ patient: ClinicPatient; form: PatientFormValues }> {
  const res = await clinicaFetch<PatientFormEnvelope>(storeId, `/v1/patients/${patientId}`, {
    method: 'PUT',
    body: JSON.stringify(toPatientUpsertBody(values)),
  });
  return {
    patient: toClinicPatient(res.data, storeId),
    form: toPatientFormValues(res.data),
  };
}

export async function updatePatientStatus(
  storeId: string,
  patientId: string,
  status: 'active' | 'inactive',
): Promise<ClinicPatient> {
  const res = await clinicaFetch<{ data: PatientApiListItem }>(
    storeId,
    `/v1/patients/${patientId}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    },
  );
  return toClinicPatient(res.data, storeId);
}

export async function uploadPatientPhoto(
  storeId: string,
  patientId: string,
  file: File,
): Promise<ClinicPatient> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await clinicaUpload<PatientFormEnvelope>(
    storeId,
    `/v1/patients/${patientId}/photo`,
    formData,
  );

  return toClinicPatient(res.data, storeId);
}

export async function deletePatientPhoto(
  storeId: string,
  patientId: string,
): Promise<ClinicPatient> {
  const res = await clinicaFetch<PatientFormEnvelope>(
    storeId,
    `/v1/patients/${patientId}/photo`,
    { method: 'DELETE' },
  );

  return toClinicPatient(res.data, storeId);
}
