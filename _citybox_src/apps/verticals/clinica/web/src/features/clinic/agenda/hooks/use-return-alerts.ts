import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/lib/store-context';
import {
  createReturnAlert,
  deleteReturnAlert,
  listReturnAlerts,
  type CreateReturnAlertInput,
  type ListReturnAlertsParams,
} from '@/features/clinic/agenda/api/return-alerts';

export const returnAlertQueryKeys = {
  all: ['schedule', 'return-alerts'] as const,
  list: (storeId: string, params: ListReturnAlertsParams) =>
    [...returnAlertQueryKeys.all, storeId, params] as const,
};

export function useReturnAlerts(params: ListReturnAlertsParams = {}) {
  const { storeId } = useStore();

  return useQuery({
    queryKey: returnAlertQueryKeys.list(storeId ?? '', params),
    queryFn: () => listReturnAlerts(storeId!, params),
    enabled: Boolean(storeId && (params.patientId === undefined || params.patientId)),
    staleTime: 60_000,
  });
}

export function useCreateReturnAlert() {
  const { storeId } = useStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReturnAlertInput) => createReturnAlert(storeId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: returnAlertQueryKeys.all });
    },
  });
}

export function useDeleteReturnAlert() {
  const { storeId } = useStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteReturnAlert(storeId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: returnAlertQueryKeys.all });
    },
  });
}
