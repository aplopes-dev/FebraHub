import { beautifulFetch } from '@/lib/beautiful-api';

export type AppointmentCategory = {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
};

export type AppointmentCategoryInput = {
  name: string;
  color?: string;
};

export async function listAppointmentCategories(): Promise<AppointmentCategory[]> {
  return beautifulFetch<AppointmentCategory[]>('/v1/appointment-categories');
}

export async function createAppointmentCategory(
  input: AppointmentCategoryInput,
): Promise<AppointmentCategory> {
  return beautifulFetch<AppointmentCategory>('/v1/appointment-categories', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateAppointmentCategory(
  id: string,
  input: AppointmentCategoryInput,
): Promise<AppointmentCategory> {
  return beautifulFetch<AppointmentCategory>(
    `/v1/appointment-categories/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  );
}

export async function deleteAppointmentCategory(id: string): Promise<void> {
  await beautifulFetch<void>(`/v1/appointment-categories/${id}`, {
    method: 'DELETE',
  });
}
