import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/lib/store-context';
import {
  checkPatientFitIn,
  createFitIn,
  deleteFitIn,
  listFitIns,
  updateFitIn,
  type ListFitInsParams,
} from '@/features/clinic/agenda/api/fit-ins';
import type { IFitInFormData } from '@/features/clinic/agenda/components/header/fit-in/types';

export const fitInQueryKeys = {
  all: ['schedule', 'fit-ins'] as const,
  list: (storeId: string, params: ListFitInsParams) =>
    [...fitInQueryKeys.all, storeId, params] as const,
  checkPatient: (storeId: string, patientId: string | undefined) =>
    ['schedule', 'fit-in-check', storeId, patientId] as const,
};

export function useFitIns(params: ListFitInsParams = {}) {
  const { storeId } = useStore();

  return useQuery({
    queryKey: fitInQueryKeys.list(storeId ?? '', params),
    queryFn: () => listFitIns(storeId!, params),
    enabled: Boolean(storeId),
    staleTime: 30_000,
  });
}

export function useCreateFitIn() {
  const { storeId } = useStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: IFitInFormData) => createFitIn(storeId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fitInQueryKeys.all });
    },
  });
}

export function useUpdateFitIn() {
  const { storeId } = useStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<IFitInFormData> }) =>
      updateFitIn(storeId!, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fitInQueryKeys.all });
    },
  });
}

export function useDeleteFitIn() {
  const { storeId } = useStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteFitIn(storeId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fitInQueryKeys.all });
    },
  });
}

export function useCheckPatientFitIn(patientId: string | undefined) {
  const { storeId } = useStore();

  return useQuery({
    queryKey: fitInQueryKeys.checkPatient(storeId ?? '', patientId),
    queryFn: () => checkPatientFitIn(storeId!, patientId!),
    enabled: Boolean(storeId) && Boolean(patientId),
    staleTime: 30_000,
  });
}
