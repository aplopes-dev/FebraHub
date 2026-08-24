'use client';

import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useStore } from '@/lib/store-context';
import { toastClinicaMutationError } from '@/features/clinic/shared/api';
import { contractModelKeys } from './query-keys';
import { useContractModelsQuery } from './use-contract-models-query';
import {
  createContractModel,
  deleteContractModel,
  updateContractModel,
} from '../services/contract-models.service';
import type { ClinicContractFormData } from '../types/clinic-contract-form';

export function useContractModels() {
  const { storeId } = useStore();
  const queryClient = useQueryClient();
  const contractModelsQuery = useContractModelsQuery();

  const invalidate = useCallback(
    () =>
      queryClient.invalidateQueries({
        queryKey: contractModelKeys.list(storeId),
      }),
    [queryClient, storeId],
  );

  const createMutation = useMutation({
    mutationFn: (values: ClinicContractFormData) =>
      createContractModel(storeId, values),
    onSuccess: () => {
      void invalidate();
      toast.success('Modelo de contrato criado.');
    },
    onError: (error) =>
      toastClinicaMutationError(
        error,
        'Não foi possível criar o modelo de contrato.',
      ),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: ClinicContractFormData }) =>
      updateContractModel(storeId, id, values),
    onSuccess: () => {
      void invalidate();
      toast.success('Modelo de contrato atualizado.');
    },
    onError: (error) =>
      toastClinicaMutationError(
        error,
        'Não foi possível atualizar o modelo de contrato.',
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteContractModel(storeId, id),
    onSuccess: () => {
      void invalidate();
      toast.success('Modelo de contrato excluído.');
    },
  });

  const saveTemplate = useCallback(
    async (payload: ClinicContractFormData & { templateId?: string }) => {
      if (payload.templateId) {
        await updateMutation.mutateAsync({
          id: payload.templateId,
          values: {
            name: payload.name,
            isDefault: payload.isDefault,
            content: payload.content,
          },
        });
        return;
      }

      await createMutation.mutateAsync({
        name: payload.name,
        isDefault: payload.isDefault,
        content: payload.content,
      });
    },
    [createMutation, updateMutation],
  );

  const deleteTemplate = useCallback(
    (id: string) => deleteMutation.mutateAsync(id),
    [deleteMutation],
  );

  return {
    templates: contractModelsQuery.data ?? [],
    isLoading: contractModelsQuery.isLoading,
    isError: contractModelsQuery.isError,
    isSaving: createMutation.isPending || updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    saveTemplate,
    deleteTemplate,
  };
}
