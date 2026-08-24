import { clinicaFetch } from '@/features/clinic/shared/api';
import type {
  AppointmentApi,
  AppointmentStatus,
  CreateAppointmentInput,
  UpdateAppointmentInput,
  UpdateAppointmentStatusInput,
} from './types';
import { buildQueryString, joinIds } from './query';

export interface ListAppointmentsParams {
  startDate?: string;
  endDate?: string;
  professionalIds?: string[];
  status?: AppointmentStatus;
  patientId?: string;
  search?: string;
  page?: number;
  perPage?: number;
  sortBy?: 'startAt' | 'status' | 'patientName';
  sortOrder?: 'asc' | 'desc';
}

export type AppointmentListMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type AppointmentListResult = {
  items: AppointmentApi[];
  meta: AppointmentListMeta;
};

type AppointmentEnvelope = { data: AppointmentApi };
type AppointmentListEnvelope = {
  data: AppointmentApi[];
  meta: AppointmentListMeta;
};

export async function listAppointments(
  storeId: string,
  params: ListAppointmentsParams = {},
): Promise<AppointmentListResult> {
  const res = await clinicaFetch<AppointmentListEnvelope>(
    storeId,
    `/v1/appointments${buildQueryString({
      startDate: params.startDate,
      endDate: params.endDate,
      professionalIds: joinIds(params.professionalIds),
      status: params.status,
      patientId: params.patientId,
      search: params.search,
      page: params.page,
      perPage: params.perPage,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    })}`,
  );
  return {
    items: res.data ?? [],
    meta: res.meta ?? {
      total: res.data?.length ?? 0,
      page: params.page ?? 1,
      perPage: params.perPage ?? 20,
      totalPages: 1,
    },
  };
}

export async function getAppointment(
  storeId: string,
  id: string,
): Promise<AppointmentApi> {
  const res = await clinicaFetch<AppointmentEnvelope>(storeId, `/v1/appointments/${id}`);
  return res.data;
}

export async function createAppointment(
  storeId: string,
  data: CreateAppointmentInput,
): Promise<AppointmentApi> {
  const res = await clinicaFetch<AppointmentEnvelope>(storeId, '/v1/appointments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function updateAppointment(
  storeId: string,
  id: string,
  data: UpdateAppointmentInput,
): Promise<AppointmentApi> {
  const res = await clinicaFetch<AppointmentEnvelope>(storeId, `/v1/appointments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function updateAppointmentStatus(
  storeId: string,
  id: string,
  data: UpdateAppointmentStatusInput,
): Promise<{ id: string; status: AppointmentStatus; updatedAt: string }> {
  const res = await clinicaFetch<AppointmentEnvelope>(storeId, `/v1/appointments/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return {
    id: res.data.id,
    status: res.data.status,
    updatedAt: res.data.updatedAt,
  };
}

export async function deleteAppointment(storeId: string, id: string): Promise<void> {
  await clinicaFetch(storeId, `/v1/appointments/${id}`, { method: 'DELETE' });
}

/** @deprecated Use funções nomeadas — mantido para compatibilidade com hooks legados. */
export const appointmentsApi = {
  list: listAppointments,
  get: getAppointment,
  create: createAppointment,
  update: updateAppointment,
  updateStatus: updateAppointmentStatus,
  delete: deleteAppointment,
};
