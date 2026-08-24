import { clinicaFetch } from '@/features/clinic/shared/api';
import type { IReturnAlert } from '../components/header/return-alert/types';
import { buildQueryString } from './query';

export interface ListReturnAlertsParams {
  startDate?: string;
  endDate?: string;
  patientId?: string;
  page?: number;
  perPage?: number;
}

export interface CreateReturnAlertInput {
  patientId: string;
  professionalId: string;
  professionalName?: string;
  returnOption: 'one_month' | 'six_months' | 'twelve_months' | 'custom_date';
  returnDate?: string;
  reason?: string;
}

export interface ListReturnAlertsResponse {
  alerts: IReturnAlert[];
  meta?: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

type ReturnAlertListEnvelope = {
  alerts: IReturnAlert[];
  meta?: ListReturnAlertsResponse['meta'];
};

export async function listReturnAlerts(
  storeId: string,
  params: ListReturnAlertsParams = {},
): Promise<ListReturnAlertsResponse> {
  const envelope = await clinicaFetch<ReturnAlertListEnvelope>(
    storeId,
    `/v1/return-alerts${buildQueryString({
      fromDate: params.startDate,
      toDate: params.endDate,
      patientId: params.patientId,
      page: params.page,
      perPage: params.perPage,
    })}`,
  );

  return {
    alerts: envelope.alerts,
    meta: envelope.meta,
  };
}

export async function createReturnAlert(
  storeId: string,
  data: CreateReturnAlertInput,
): Promise<{ id: string }> {
  return clinicaFetch<{ id: string }>(storeId, '/v1/return-alerts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteReturnAlert(storeId: string, id: string): Promise<void> {
  await clinicaFetch(storeId, `/v1/return-alerts/${id}`, { method: 'DELETE' });
}

/** @deprecated Use funções nomeadas — mantido para compatibilidade com hooks legados. */
export const returnAlertsApi = {
  list: listReturnAlerts,
  create: createReturnAlert,
  delete: deleteReturnAlert,
};
