import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CLIENTS_QUERY_KEY } from '@/features/clients/hooks/use-clients-queries';
import * as appointmentService from '../services/appointment-service';
import type {
  AppointmentFormData,
  AppointmentStatus,
} from '../types/agenda.types';

export const APPOINTMENTS_QUERY_KEY = ['appointments'] as const;

export function useAppointmentsQuery(
  params: appointmentService.ListAppointmentsParams | null,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [...APPOINTMENTS_QUERY_KEY, params],
    queryFn: () => appointmentService.listAppointments(params!),
    enabled:
      Boolean(params?.from && params?.to) && (options?.enabled ?? true),
  });
}

export function useCreateAppointmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AppointmentFormData) =>
      appointmentService.createAppointment(data),
    onSuccess: (_created, variables) => {
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEY });
      if (variables.newClient) {
        queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY });
      }
    },
  });
}

export function useUpdateAppointmentStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: AppointmentStatus;
    }) => appointmentService.updateAppointmentStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEY });
    },
  });
}

export function useUpdateAppointmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: appointmentService.UpdateAppointmentPayload;
    }) => appointmentService.updateAppointment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEY });
    },
  });
}
