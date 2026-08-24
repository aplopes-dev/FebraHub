import { clinicaFetch } from '@/features/clinic/shared/api';

export type CancelledAppointmentTaskApiItem = {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  professionalId: string;
  appointmentAt: string;
  durationMin: number;
  categoryId: string | null;
  observations: string | null;
  status: 'missed' | 'cancelled_patient' | 'cancelled_pro';
};

export type CancelledAppointmentTasksListMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type CancelledAppointmentTasksListParams = {
  startDate: string;
  endDate: string;
  page?: number;
  perPage?: number;
};

type CancelledAppointmentTasksEnvelope = {
  data: CancelledAppointmentTaskApiItem[];
  meta: CancelledAppointmentTasksListMeta;
};

function buildQuery(params: CancelledAppointmentTasksListParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set('startDate', params.startDate);
  searchParams.set('endDate', params.endDate);
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.perPage !== undefined) {
    searchParams.set('perPage', String(params.perPage));
  }
  return `?${searchParams.toString()}`;
}

export async function listCancelledAppointmentTasks(
  storeId: string,
  params: CancelledAppointmentTasksListParams,
): Promise<{
  items: CancelledAppointmentTaskApiItem[];
  meta: CancelledAppointmentTasksListMeta;
}> {
  const res = await clinicaFetch<CancelledAppointmentTasksEnvelope>(
    storeId,
    `/v1/dashboard/tasks/cancelled-appointments${buildQuery(params)}`,
  );
  return { items: res.data, meta: res.meta };
}
