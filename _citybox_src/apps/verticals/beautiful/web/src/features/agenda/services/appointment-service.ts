import { beautifulFetch } from '@/lib/beautiful-api';
import type {
  AgendaAppointment,
  AppointmentFormData,
  AppointmentStatus,
} from '../types/agenda.types';

type AppointmentServiceApiResponse = {
  id?: string;
  professionalId: string;
  professionalName?: string;
  serviceId: string;
  serviceName?: string;
  price: number;
  duration: number;
};

type AppointmentApiResponse = {
  id: string;
  clientId: string;
  clientName?: string;
  clientPhone?: string;
  clientNotes: string | null;
  startAt: string;
  endAt: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  totalPrice: number;
  professionalId?: string;
  professionalName?: string;
  serviceId?: string;
  serviceName?: string;
  categoryId?: string | null;
  categoryName?: string | null;
  categoryColor?: string | null;
  services: AppointmentServiceApiResponse[];
  createdAt: string;
  updatedAt: string;
};

export type ListAppointmentsParams = {
  from: string;
  to: string;
  professionalId?: string;
  clientId?: string;
  status?: AppointmentStatus;
};

function mapAppointment(raw: AppointmentApiResponse): AgendaAppointment {
  const first = raw.services[0];
  return {
    id: raw.id,
    clientId: raw.clientId,
    clientName: raw.clientName ?? '',
    clientPhone: raw.clientPhone ?? '',
    clientNotes: raw.clientNotes ?? undefined,
    professionalId: raw.professionalId ?? first?.professionalId ?? '',
    professionalName:
      raw.professionalName ?? first?.professionalName ?? '',
    serviceId: raw.serviceId ?? first?.serviceId ?? '',
    serviceName: raw.serviceName ?? first?.serviceName ?? '',
    categoryId: raw.categoryId ?? null,
    categoryName: raw.categoryName ?? null,
    categoryColor: raw.categoryColor ?? null,
    date: raw.date,
    startTime: raw.startTime,
    endTime: raw.endTime,
    status: raw.status,
    totalPrice: raw.totalPrice,
  };
}

export async function listAppointments(
  params: ListAppointmentsParams,
): Promise<AgendaAppointment[]> {
  const query = new URLSearchParams();
  query.set('from', params.from);
  query.set('to', params.to);
  if (params.professionalId) query.set('professionalId', params.professionalId);
  if (params.clientId) query.set('clientId', params.clientId);
  if (params.status) query.set('status', params.status);

  const response = await beautifulFetch<AppointmentApiResponse[]>(
    `/v1/appointments?${query.toString()}`,
  );
  return response.map(mapAppointment);
}

export async function createAppointment(
  data: AppointmentFormData,
): Promise<AgendaAppointment> {
  const body: Record<string, unknown> = {
    clientNotes: data.clientNotes || undefined,
    categoryId: data.categoryId ?? null,
    date: data.date,
    startTime: data.startTime,
    status: data.status,
    services: [
      {
        professionalId: data.professionalId,
        serviceId: data.serviceId,
      },
    ],
  };

  if (data.newClient) {
    body.newClient = {
      name: data.newClient.name,
      phone: data.newClient.phone,
    };
  } else {
    body.clientId = data.clientId;
  }

  const response = await beautifulFetch<AppointmentApiResponse>(
    '/v1/appointments',
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  );
  return mapAppointment(response);
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
): Promise<AgendaAppointment> {
  const response = await beautifulFetch<AppointmentApiResponse>(
    `/v1/appointments/${id}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    },
  );
  return mapAppointment(response);
}

export type UpdateAppointmentPayload = {
  clientNotes?: string;
  categoryId?: string | null;
  date: string;
  startTime: string;
  professionalId: string;
  serviceId: string;
};

export async function updateAppointment(
  id: string,
  data: UpdateAppointmentPayload,
): Promise<AgendaAppointment> {
  const response = await beautifulFetch<AppointmentApiResponse>(
    `/v1/appointments/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        clientNotes: data.clientNotes || undefined,
        categoryId: data.categoryId ?? null,
        date: data.date,
        startTime: data.startTime,
        services: [
          {
            professionalId: data.professionalId,
            serviceId: data.serviceId,
          },
        ],
      }),
    },
  );
  return mapAppointment(response);
}
