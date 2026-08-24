import { clinicaFetch } from '@/features/clinic/shared/api';
import type {
  IFitIn,
  IFitInFormData,
  IPatientFitInCheck,
  TFitInStatus,
} from '../components/header/fit-in/types';
import { buildQueryString } from './query';

export interface ListFitInsParams {
  status?: TFitInStatus;
  startDate?: string;
  endDate?: string;
}

export interface ListFitInsResponse {
  fitIns: IFitIn[];
}

type FitInListEnvelope = { fitIns: IFitIn[] };
type FitInIdEnvelope = { id: string };

function toFitInBody(data: IFitInFormData) {
  return {
    patientId: data.patientId,
    professionalId: data.professionalId || undefined,
    categoryId: data.categoryId || undefined,
    anyDate: data.anyDate,
    fitInDate: data.fitInDate || undefined,
    shifts: data.shifts,
    planName: data.planName || undefined,
    observation: data.observation || undefined,
    isUrgent: data.isUrgent,
  };
}

function toFitInUpdateBody(data: Partial<IFitInFormData>) {
  const body: Record<string, unknown> = {};
  if (data.patientId !== undefined) body.patientId = data.patientId;
  if (data.professionalId !== undefined) body.professionalId = data.professionalId || undefined;
  if (data.categoryId !== undefined) body.categoryId = data.categoryId || undefined;
  if (data.anyDate !== undefined) body.anyDate = data.anyDate;
  if (data.fitInDate !== undefined) body.fitInDate = data.fitInDate || undefined;
  if (data.shifts !== undefined) body.shifts = data.shifts;
  if (data.planName !== undefined) body.planName = data.planName || undefined;
  if (data.observation !== undefined) body.observation = data.observation || undefined;
  if (data.isUrgent !== undefined) body.isUrgent = data.isUrgent;
  return body;
}

export async function listFitIns(
  storeId: string,
  params: ListFitInsParams = {},
): Promise<ListFitInsResponse> {
  return clinicaFetch<FitInListEnvelope>(
    storeId,
    `/v1/fit-ins${buildQueryString({
      status: params.status,
      startDate: params.startDate,
      endDate: params.endDate,
    })}`,
  );
}

export async function createFitIn(
  storeId: string,
  data: IFitInFormData,
): Promise<{ id: string }> {
  return clinicaFetch<FitInIdEnvelope>(storeId, '/v1/fit-ins', {
    method: 'POST',
    body: JSON.stringify(toFitInBody(data)),
  });
}

export async function updateFitIn(
  storeId: string,
  id: string,
  data: Partial<IFitInFormData>,
): Promise<{ id: string }> {
  return clinicaFetch<FitInIdEnvelope>(storeId, `/v1/fit-ins/${id}`, {
    method: 'PUT',
    body: JSON.stringify(toFitInUpdateBody(data)),
  });
}

export async function deleteFitIn(storeId: string, id: string): Promise<void> {
  await clinicaFetch(storeId, `/v1/fit-ins/${id}`, { method: 'DELETE' });
}

export async function checkPatientFitIn(
  storeId: string,
  patientId: string,
): Promise<IPatientFitInCheck> {
  return clinicaFetch<IPatientFitInCheck>(storeId, `/v1/fit-ins/check-patient/${patientId}`);
}

/** @deprecated Use funções nomeadas — mantido para compatibilidade com hooks legados. */
export const fitInsApi = {
  list: listFitIns,
  create: createFitIn,
  update: updateFitIn,
  delete: deleteFitIn,
  checkPatient: checkPatientFitIn,
};
