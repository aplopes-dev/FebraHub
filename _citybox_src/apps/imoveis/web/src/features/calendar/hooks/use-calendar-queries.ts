'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@citybox/mui/molecules';
import {
  createAppointment,
  deleteAppointment,
  getAppointmentById,
  listAppointments,
  toggleAppointmentDone,
  updateAppointment,
} from '../services/calendar-service';
import type {
  AppointmentWriteInput,
  CalendarAppointment,
  ListAppointmentsParams,
} from '../types';
import { appointmentKeys } from './query-keys';
import { dashboardKeys } from '@/features/dashboard/hooks/query-keys';
import { remindersKeys } from '@/features/reminders/hooks/use-reminders-query';

export function useAppointmentsQuery(
  params: ListAppointmentsParams,
  enabled = true,
) {
  return useQuery({
    queryKey: appointmentKeys.list(params),
    queryFn: () => listAppointments(params),
    enabled: Boolean(params.from && params.to) && enabled,
    placeholderData: (prev) => prev,
  });
}

export function useAppointmentQuery(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: appointmentKeys.detail(id ?? ''),
    queryFn: () => getAppointmentById(id!),
    enabled: Boolean(id) && enabled,
  });
}

function useInvalidateAppointments() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: appointmentKeys.all }),
      qc.invalidateQueries({ queryKey: dashboardKeys.all }),
      qc.invalidateQueries({ queryKey: remindersKeys.all }),
    ]);
}

export function useCreateAppointmentMutation() {
  const invalidate = useInvalidateAppointments();
  return useMutation({
    mutationFn: (input: AppointmentWriteInput) => createAppointment(input),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateAppointmentMutation() {
  const invalidate = useInvalidateAppointments();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AppointmentWriteInput }) =>
      updateAppointment(id, input),
    onSuccess: () => invalidate(),
  });
}

export function useDeleteAppointmentMutation() {
  const invalidate = useInvalidateAppointments();
  return useMutation({
    mutationFn: (id: string) => deleteAppointment(id),
    onSuccess: () => invalidate(),
  });
}

export function useToggleAppointmentDoneMutation() {
  const invalidate = useInvalidateAppointments();
  return useMutation({
    mutationFn: (appointment: CalendarAppointment) =>
      toggleAppointmentDone(appointment),
    onSuccess: () => invalidate(),
    onError: () => {
      toast.error('Não foi possível atualizar o compromisso.');
    },
  });
}
