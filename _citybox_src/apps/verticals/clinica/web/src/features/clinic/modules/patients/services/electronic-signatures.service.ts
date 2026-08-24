import { clinicaFetch } from '@/features/clinic/shared/api';
import { fetchWithSession } from '@/lib/auth-fetch';
import type { ElectronicSignature } from '../types/electronic-signature';

type SignatureEnvelope = { data: ElectronicSignature };

export async function requestAnamnesisSignature(
  storeId: string,
  patientId: string,
  anamnesisId: string,
  body: { fileBase64: string; signerEmail?: string },
): Promise<ElectronicSignature> {
  const res = await clinicaFetch<SignatureEnvelope>(
    storeId,
    `/v1/patients/${patientId}/anamneses/${anamnesisId}/request-signature`,
    { method: 'POST', body: JSON.stringify(body) },
  );
  return res.data;
}

export async function requestContractSignature(
  storeId: string,
  patientId: string,
  contractId: string,
  body: {
    fileBase64: string;
    signerEmail?: string;
    responsible: { name: string; email?: string; phone?: string };
  },
): Promise<ElectronicSignature> {
  const res = await clinicaFetch<SignatureEnvelope>(
    storeId,
    `/v1/patients/${patientId}/contracts/${contractId}/request-signature`,
    { method: 'POST', body: JSON.stringify(body) },
  );
  return res.data;
}

export async function requestEvolutionBatchSignature(
  storeId: string,
  patientId: string,
  body: {
    evolutionIds: string[];
    fileBase64: string;
    signerEmail?: string;
  },
): Promise<ElectronicSignature> {
  const res = await clinicaFetch<SignatureEnvelope>(
    storeId,
    `/v1/patients/${patientId}/evolutions/request-signature`,
    { method: 'POST', body: JSON.stringify(body) },
  );
  return res.data;
}

export async function getElectronicSignature(
  storeId: string,
  patientId: string,
  signatureId: string,
): Promise<ElectronicSignature> {
  const res = await clinicaFetch<SignatureEnvelope>(
    storeId,
    `/v1/patients/${patientId}/signatures/${signatureId}`,
  );
  return res.data;
}

export type ListPatientSignaturesParams = {
  status?: ElectronicSignature['status'];
  page?: number;
  perPage?: number;
};

export type PatientSignaturesListMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

type PatientSignaturesListEnvelope = {
  data: ElectronicSignature[];
  meta: PatientSignaturesListMeta;
};

export async function listPatientSignatures(
  storeId: string,
  patientId: string,
  params: ListPatientSignaturesParams = {},
): Promise<{ items: ElectronicSignature[]; meta: PatientSignaturesListMeta }> {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set('status', params.status);
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.perPage !== undefined) {
    searchParams.set('perPage', String(params.perPage));
  }
  const query = searchParams.toString();
  const res = await clinicaFetch<PatientSignaturesListEnvelope>(
    storeId,
    `/v1/patients/${patientId}/signatures${query ? `?${query}` : ''}`,
  );
  return { items: res.data, meta: res.meta };
}

export async function getElectronicSignatureByTarget(
  storeId: string,
  patientId: string,
  kind: ElectronicSignature['kind'],
  targetId: string,
  options?: { sync?: boolean },
): Promise<ElectronicSignature> {
  const syncQuery = options?.sync ? '?sync=true' : '';
  const res = await clinicaFetch<SignatureEnvelope>(
    storeId,
    `/v1/patients/${patientId}/signatures/by-target/${kind}/${targetId}${syncQuery}`,
  );
  return res.data;
}

export async function cancelElectronicSignature(
  storeId: string,
  patientId: string,
  signatureId: string,
): Promise<ElectronicSignature> {
  const res = await clinicaFetch<SignatureEnvelope>(
    storeId,
    `/v1/patients/${patientId}/signatures/${signatureId}/cancel`,
    { method: 'POST' },
  );
  return res.data;
}

export function buildSignedPdfProxyUrl(
  patientId: string,
  signatureId: string,
  storeId: string,
): string {
  return `/api/proxy/clinica/v1/patients/${patientId}/signatures/${signatureId}/signed-pdf?storeId=${encodeURIComponent(storeId)}`;
}

export async function fetchSignedPdfBlob(
  storeId: string,
  patientId: string,
  signatureId: string,
): Promise<Blob> {
  const headers = new Headers();
  headers.set('X-Store-Id', storeId);
  const res = await fetchWithSession(
    `/api/proxy/clinica/v1/patients/${patientId}/signatures/${signatureId}/signed-pdf`,
    { headers },
  );
  if (!res.ok) {
    throw new Error('Não foi possível baixar o PDF assinado.');
  }
  return res.blob();
}
