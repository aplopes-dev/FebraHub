'use client';

import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useStore } from '@/lib/store-context';
import {
  getExternalProfessionalErrorMessage,
  usePatientExternalProfessionalMutations,
  usePatientExternalProfessionalsQuery,
} from '../hooks/use-patient-external-professionals-query';
import type {
  ExternalReferralProfessional,
  ExternalReferralProfessionalInput,
} from '../types/external-referral-professional';

export function usePatientExternalProfessionals() {
  const { storeId } = useStore();
  const professionalsQuery = usePatientExternalProfessionalsQuery(storeId);
  const { createMutation, updateMutation, deleteMutation } =
    usePatientExternalProfessionalMutations(storeId);

  const externalProfessionals = useMemo(
    () => professionalsQuery.data ?? [],
    [professionalsQuery.data],
  );

  const addExternalProfessional = useCallback(
    async (
      input: ExternalReferralProfessionalInput,
    ): Promise<ExternalReferralProfessional> => {
      if (!storeId) {
        throw new Error('Loja não selecionada.');
      }
      try {
        return await createMutation.mutateAsync(input);
      } catch (error) {
        toast.error(getExternalProfessionalErrorMessage(error));
        throw error;
      }
    },
    [createMutation, storeId],
  );

  const updateExternalProfessional = useCallback(
    async (
      id: string,
      input: ExternalReferralProfessionalInput,
    ): Promise<ExternalReferralProfessional> => {
      if (!storeId) {
        throw new Error('Loja não selecionada.');
      }
      try {
        return await updateMutation.mutateAsync({ id, input });
      } catch (error) {
        toast.error(getExternalProfessionalErrorMessage(error));
        throw error;
      }
    },
    [storeId, updateMutation],
  );

  const deleteExternalProfessional = useCallback(
    async (id: string): Promise<void> => {
      if (!storeId) {
        throw new Error('Loja não selecionada.');
      }
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        toast.error(getExternalProfessionalErrorMessage(error));
        throw error;
      }
    },
    [deleteMutation, storeId],
  );

  return {
    externalProfessionals,
    isLoading: professionalsQuery.isLoading,
    addExternalProfessional,
    updateExternalProfessional,
    deleteExternalProfessional,
  };
}
