import { clinicaFetch, clinicaUpload } from '@/features/clinic/shared/api';
import {
  toAvulsoDebitBody,
  toPatientFinancialEntry,
  toReceiveBody,
  toUpdatePendingDebitBody,
} from '../lib/patient-financial-entry-api-mappers';
import type { PatientFinancialDebitFormValues } from '../types/patient-financial-debit-form';
import type { PatientFinancialEntry } from '../types/patient-financial-entry';
import type { PatientFinancialReceiveFormValues } from '../types/patient-financial-receive-form';
import type {
  PatientFinancialEntryApiDetail,
  PatientFinancialEntryApiSummary,
  PatientFinancialEntryListMeta,
  PatientFinancialEntryListParams,
} from '../types/patient-financial-entry-api';

type FinancialEntryListEnvelope = {
  data: PatientFinancialEntryApiSummary[];
  meta: PatientFinancialEntryListMeta;
};

type FinancialEntryDetailEnvelope = {
  data: PatientFinancialEntryApiDetail;
};

function buildFinancialEntryListQuery(params: PatientFinancialEntryListParams): string {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.perPage !== undefined) searchParams.set('perPage', String(params.perPage));
  if (params.search?.trim()) searchParams.set('search', params.search.trim());
  if (params.status) searchParams.set('status', params.status);
  if (params.periodFrom) searchParams.set('periodFrom', params.periodFrom);
  if (params.periodTo) searchParams.set('periodTo', params.periodTo);
  if (params.budgetItemId) searchParams.set('budgetItemId', params.budgetItemId);
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

function attachmentsBasePath(patientId: string, entryId: string): string {
  return `/v1/patients/${patientId}/financial-entries/${entryId}/attachments`;
}

export async function listPatientFinancialEntries(
  storeId: string,
  patientId: string,
  params: PatientFinancialEntryListParams = {},
): Promise<{ items: PatientFinancialEntry[]; meta: PatientFinancialEntryListMeta }> {
  const res = await clinicaFetch<FinancialEntryListEnvelope>(
    storeId,
    `/v1/patients/${patientId}/financial-entries${buildFinancialEntryListQuery(params)}`,
  );

  return {
    items: res.data.map(toPatientFinancialEntry),
    meta: res.meta,
  };
}

export async function getPatientFinancialEntryById(
  storeId: string,
  patientId: string,
  entryId: string,
): Promise<PatientFinancialEntry> {
  const res = await clinicaFetch<FinancialEntryDetailEnvelope>(
    storeId,
    `/v1/patients/${patientId}/financial-entries/${entryId}`,
  );

  return toPatientFinancialEntry(res.data);
}

export async function createAvulsoDebit(
  storeId: string,
  patientId: string,
  values: PatientFinancialDebitFormValues,
): Promise<PatientFinancialEntry> {
  const res = await clinicaFetch<FinancialEntryDetailEnvelope>(
    storeId,
    `/v1/patients/${patientId}/financial-entries`,
    {
      method: 'POST',
      body: JSON.stringify(toAvulsoDebitBody(values)),
    },
  );

  let entry = toPatientFinancialEntry(res.data);

  for (const file of values.attachments) {
    entry = await uploadPatientFinancialEntryAttachment(
      storeId,
      patientId,
      entry.id,
      file,
    );
  }

  return entry;
}

export async function updatePendingDebit(
  storeId: string,
  patientId: string,
  entryId: string,
  values: PatientFinancialDebitFormValues,
): Promise<PatientFinancialEntry> {
  const res = await clinicaFetch<FinancialEntryDetailEnvelope>(
    storeId,
    `/v1/patients/${patientId}/financial-entries/${entryId}`,
    {
      method: 'PUT',
      body: JSON.stringify(toUpdatePendingDebitBody(values)),
    },
  );

  let entry = toPatientFinancialEntry(res.data);

  for (const file of values.attachments) {
    entry = await uploadPatientFinancialEntryAttachment(
      storeId,
      patientId,
      entryId,
      file,
    );
  }

  return entry;
}

/** @deprecated Prefer updatePendingDebit */
export async function updateAvulsoDebit(
  storeId: string,
  patientId: string,
  entryId: string,
  values: PatientFinancialDebitFormValues,
): Promise<PatientFinancialEntry> {
  return updatePendingDebit(storeId, patientId, entryId, values);
}

export async function uploadPatientFinancialEntryAttachment(
  storeId: string,
  patientId: string,
  entryId: string,
  file: File,
): Promise<PatientFinancialEntry> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await clinicaUpload<FinancialEntryDetailEnvelope>(
    storeId,
    attachmentsBasePath(patientId, entryId),
    formData,
    { method: 'POST' },
  );

  return toPatientFinancialEntry(res.data);
}

export async function deletePatientFinancialEntryAttachment(
  storeId: string,
  patientId: string,
  entryId: string,
  attachmentId: string,
): Promise<PatientFinancialEntry> {
  const res = await clinicaFetch<FinancialEntryDetailEnvelope>(
    storeId,
    `${attachmentsBasePath(patientId, entryId)}/${attachmentId}`,
    { method: 'DELETE' },
  );

  return toPatientFinancialEntry(res.data);
}

export function patientFinancialEntryAttachmentContentPath(
  patientId: string,
  entryId: string,
  attachmentId: string,
): string {
  return `${attachmentsBasePath(patientId, entryId)}/${attachmentId}`;
}

export async function deletePatientFinancialEntry(
  storeId: string,
  patientId: string,
  entryId: string,
): Promise<void> {
  await clinicaFetch(
    storeId,
    `/v1/patients/${patientId}/financial-entries/${entryId}`,
    { method: 'DELETE' },
  );
}

export async function receivePatientFinancialEntry(
  storeId: string,
  patientId: string,
  entryId: string,
  values: PatientFinancialReceiveFormValues,
): Promise<PatientFinancialEntry> {
  const res = await clinicaFetch<FinancialEntryDetailEnvelope>(
    storeId,
    `/v1/patients/${patientId}/financial-entries/${entryId}/receive`,
    {
      method: 'PATCH',
      body: JSON.stringify(toReceiveBody(values)),
    },
  );

  return toPatientFinancialEntry(res.data);
}
