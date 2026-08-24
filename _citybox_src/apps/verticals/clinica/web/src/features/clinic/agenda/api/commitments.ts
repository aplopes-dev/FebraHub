import { clinicaFetch } from '@/features/clinic/shared/api';
import type {
  CommitmentApi,
  CreateCommitmentInput,
  UpdateCommitmentInput,
} from './types';
import { buildQueryString, joinIds } from './query';

export interface ListCommitmentsParams {
  startDate?: string;
  endDate?: string;
  professionalIds?: string[];
}

type CommitmentEnvelope = { data: CommitmentApi };
type CommitmentListEnvelope = { data: CommitmentApi[] };

export async function listCommitments(
  storeId: string,
  params: ListCommitmentsParams = {},
): Promise<CommitmentApi[]> {
  const res = await clinicaFetch<CommitmentListEnvelope>(
    storeId,
    `/v1/internal-events${buildQueryString({
      startDate: params.startDate,
      endDate: params.endDate,
      professionalIds: joinIds(params.professionalIds),
    })}`,
  );
  return res.data;
}

export async function getCommitment(storeId: string, id: string): Promise<CommitmentApi> {
  const res = await clinicaFetch<CommitmentEnvelope>(storeId, `/v1/internal-events/${id}`);
  return res.data;
}

export async function createCommitment(
  storeId: string,
  data: CreateCommitmentInput,
): Promise<CommitmentApi> {
  const res = await clinicaFetch<CommitmentEnvelope>(storeId, '/v1/internal-events', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function updateCommitment(
  storeId: string,
  id: string,
  data: UpdateCommitmentInput,
): Promise<CommitmentApi> {
  const res = await clinicaFetch<CommitmentEnvelope>(storeId, `/v1/internal-events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function deleteCommitment(storeId: string, id: string): Promise<void> {
  await clinicaFetch(storeId, `/v1/internal-events/${id}`, { method: 'DELETE' });
}

/** @deprecated Use funções nomeadas — mantido para compatibilidade com hooks legados. */
export const commitmentsApi = {
  list: listCommitments,
  get: getCommitment,
  create: createCommitment,
  update: updateCommitment,
  delete: deleteCommitment,
};
