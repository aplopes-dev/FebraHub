import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as appointmentCategoriesService from '../services/appointment-categories-service';
import type { AppointmentCategoryInput } from '../services/appointment-categories-service';

export const APPOINTMENT_CATEGORIES_QUERY_KEY = [
  'appointment-categories',
] as const;

export function useAppointmentCategoriesQuery() {
  return useQuery({
    queryKey: APPOINTMENT_CATEGORIES_QUERY_KEY,
    queryFn: () => appointmentCategoriesService.listAppointmentCategories(),
  });
}

export function useCreateAppointmentCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AppointmentCategoryInput) =>
      appointmentCategoriesService.createAppointmentCategory(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: APPOINTMENT_CATEGORIES_QUERY_KEY,
      });
    },
  });
}

export function useUpdateAppointmentCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: AppointmentCategoryInput & { id: string }) =>
      appointmentCategoriesService.updateAppointmentCategory(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: APPOINTMENT_CATEGORIES_QUERY_KEY,
      });
    },
  });
}

export function useDeleteAppointmentCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      appointmentCategoriesService.deleteAppointmentCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: APPOINTMENT_CATEGORIES_QUERY_KEY,
      });
    },
  });
}
