import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/lib/store-context';
import {
  createAppointment,
  deleteAppointment,
  getAppointment,
  updateAppointment,
  updateAppointmentStatus,
} from '@/features/clinic/agenda/api/appointments';
import type {
  AppointmentApi,
  AppointmentStatus,
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from '@/features/clinic/agenda/api/types';
import { calendarQueryKeys } from './use-calendar';
import { fitInQueryKeys } from './use-fit-ins';
import { returnAlertQueryKeys } from './use-return-alerts';
import { invalidateClinicDashboardQueries } from '@/features/clinic/modules/dashboard/lib/invalidate-clinic-dashboard-queries';
import { patientAppointmentKeys } from '@/features/clinic/modules/patients/hooks/query-keys';

export const appointmentQueryKeys = {
  all: ['schedule', 'appointments'] as const,
  detail: (storeId: string, id: string) =>
    [...appointmentQueryKeys.all, storeId, id] as const,
};

function invalidatePatientAppointments(
  queryClient: ReturnType<typeof useQueryClient>,
  storeId: string,
  patientId?: string,
) {
  if (patientId) {
    queryClient.invalidateQueries({
      queryKey: patientAppointmentKeys.all(storeId, patientId),
    });
    return;
  }
  queryClient.invalidateQueries({
    predicate: (query) =>
      Array.isArray(query.queryKey) &&
      query.queryKey.includes('appointments') &&
      query.queryKey.includes(storeId),
  });
}

export function useAppointment(id: string) {
  const { storeId } = useStore();

  return useQuery<AppointmentApi>({
    queryKey: appointmentQueryKeys.detail(storeId ?? '', id),
    queryFn: () => getAppointment(storeId!, id),
    enabled: Boolean(storeId) && Boolean(id),
  });
}

export function useCreateAppointment() {
  const { storeId } = useStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAppointmentInput) => createAppointment(storeId!, data),
    onSuccess: (_, variables) => {
      if (!storeId) return;
      queryClient.invalidateQueries({ queryKey: calendarQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: returnAlertQueryKeys.all });
      invalidatePatientAppointments(queryClient, storeId, variables.patientId);
      if (variables.fitInId) {
        queryClient.invalidateQueries({ queryKey: fitInQueryKeys.all });
      }
    },
  });
}

export function useUpdateAppointment() {
  const { storeId } = useStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAppointmentInput }) =>
      updateAppointment(storeId!, id, data),
    onSuccess: (_, { id, data }) => {
      if (!storeId) return;
      queryClient.invalidateQueries({ queryKey: calendarQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: appointmentQueryKeys.detail(storeId, id) });
      invalidatePatientAppointments(queryClient, storeId, data.patientId);
    },
  });
}

export function useUpdateAppointmentStatus() {
  const { storeId } = useStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      confirmationSource,
    }: {
      id: string;
      status: AppointmentStatus;
      confirmationSource?: 'manual' | 'whatsapp' | null;
    }) =>
      updateAppointmentStatus(storeId!, id, { status, confirmationSource }),
    onSuccess: (_, { id }) => {
      if (!storeId) return;
      queryClient.invalidateQueries({ queryKey: calendarQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: appointmentQueryKeys.detail(storeId, id) });
      invalidatePatientAppointments(queryClient, storeId);
      // Tarefas · Consultas canceladas + cards do dashboard
      invalidateClinicDashboardQueries(queryClient);
    },
  });
}

export function useDeleteAppointment() {
  const { storeId } = useStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAppointment(storeId!, id),
    onSuccess: () => {
      if (!storeId) return;
      queryClient.invalidateQueries({ queryKey: calendarQueryKeys.all });
      invalidatePatientAppointments(queryClient, storeId);
      invalidateClinicDashboardQueries(queryClient);
    },
  });
}
