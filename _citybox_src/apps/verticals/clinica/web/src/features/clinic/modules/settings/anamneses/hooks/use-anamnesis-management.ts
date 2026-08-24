'use client';

import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useStore } from '@/lib/store-context';
import { toastClinicaMutationError } from '@/features/clinic/shared/api';
import { anamnesisKeys } from './query-keys';
import {
  createAnamnesisTemplate,
  deleteAnamnesisTemplate,
  updateAnamnesisTemplate,
  updateAnamnesisTemplateStatus,
} from '../services/anamnesis.service';
import type { ClinicAnamnesisTemplate } from '../types/clinic-anamnesis';
import type { ClinicAnamnesisSheetSuccessPayload } from '../types/clinic-anamnesis-form';

export function useAnamnesisManagement() {
  const { storeId } = useStore();
  const queryClient = useQueryClient();

  const invalidateTemplates = useCallback(
    () => queryClient.invalidateQueries({ queryKey: anamnesisKeys.templates(storeId) }),
    [queryClient, storeId],
  );

  const invalidateQuestions = useCallback(
    () => queryClient.invalidateQueries({ queryKey: anamnesisKeys.questions(storeId) }),
    [queryClient, storeId],
  );

  const saveTemplateMutation = useMutation({
    mutationFn: (payload: ClinicAnamnesisSheetSuccessPayload) => {
      if (payload.templateId) {
        return updateAnamnesisTemplate(storeId, payload.templateId, payload);
      }
      return createAnamnesisTemplate(storeId, payload);
    },
    onSuccess: () => {
      void invalidateTemplates();
      void invalidateQuestions();
      toast.success('Modelo de anamnese salvo.');
    },
    onError: (error) =>
      toastClinicaMutationError(
        error,
        'Não foi possível salvar o modelo de anamnese.',
      ),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({
      template,
      active,
    }: {
      template: ClinicAnamnesisTemplate;
      active: boolean;
    }) =>
      updateAnamnesisTemplateStatus(
        storeId,
        template.id,
        active ? 'active' : 'inactive',
      ),
    onSuccess: () => {
      void invalidateTemplates();
    },
    onError: (error, variables) => {
      void invalidateTemplates();
      toastClinicaMutationError(
        error,
        `Não foi possível atualizar o status de "${variables.template.name}".`,
      );
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (templateId: string) => deleteAnamnesisTemplate(storeId, templateId),
    onSuccess: () => {
      void invalidateTemplates();
      toast.success('Modelo de anamnese excluído.');
    },
  });

  return {
    saveTemplate: saveTemplateMutation.mutateAsync,
    updateTemplateStatus: updateStatusMutation.mutateAsync,
    deleteTemplate: deleteTemplateMutation.mutateAsync,
    deleteError: deleteTemplateMutation.error,
    clearDeleteError: () => deleteTemplateMutation.reset(),
    isSaving: saveTemplateMutation.isPending,
    isDeleting: deleteTemplateMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
  };
}
