'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClinicaApiError } from '@/features/clinic/shared/api';
import {
  createPatientExternalProfessional,
  deletePatientExternalProfessional,
  listPatientExternalProfessionals,
  updatePatientExternalProfessional,
} from '../services/patient-external-professionals.service';
import { patientKeys } from './query-keys';
import type {
  ExternalReferralProfessional,
  ExternalReferralProfessionalInput,
} from '../types/external-referral-professional';

export function usePatientExternalProfessionalsQuery(storeId: string | null) {
  return useQuery({
    queryKey: patientKeys.externalProfessionals(storeId ?? ''),
    queryFn: () => listPatientExternalProfessionals(storeId!),
    enabled: Boolean(storeId),
  });
}

export function usePatientExternalProfessionalMutations(storeId: string | null) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    if (!storeId) return;
    void queryClient.invalidateQueries({
      queryKey: patientKeys.externalProfessionals(storeId),
    });
  };

  const createMutation = useMutation({
    mutationFn: (input: ExternalReferralProfessionalInput) =>
      createPatientExternalProfessional(storeId!, input),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: ExternalReferralProfessionalInput;
    }) => updatePatientExternalProfessional(storeId!, id, input),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePatientExternalProfessional(storeId!, id),
    onSuccess: invalidate,
  });

  return { createMutation, updateMutation, deleteMutation };
}

export function getExternalProfessionalErrorMessage(error: unknown): string {
  if (error instanceof ClinicaApiError) {
    if (error.status === 409) {
      return 'Já existe um profissional externo com este nome.';
    }
    return error.message;
  }
  return 'Não foi possível concluir a operação.';
}

export type { ExternalReferralProfessional };
