'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClinicaApiError } from '@/features/clinic/shared/api';
import {
  createPatientReferralOrigin,
  listPatientReferralOrigins,
} from '../services/patient-referral-origins.service';
import { patientKeys } from './query-keys';
import type {
  PatientReferralOrigin,
  PatientReferralOriginInput,
} from '../types/patient-referral-origin';

export function usePatientReferralOriginsQuery(storeId: string | null) {
  return useQuery({
    queryKey: patientKeys.referralOrigins(storeId ?? ''),
    queryFn: () => listPatientReferralOrigins(storeId!),
    enabled: Boolean(storeId),
  });
}

export function usePatientReferralOriginMutations(storeId: string | null) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    if (!storeId) return;
    void queryClient.invalidateQueries({ queryKey: patientKeys.referralOrigins(storeId) });
  };

  const createMutation = useMutation({
    mutationFn: (input: PatientReferralOriginInput) =>
      createPatientReferralOrigin(storeId!, input),
    onSuccess: invalidate,
  });

  return { createMutation };
}

export function getReferralOriginErrorMessage(error: unknown): string {
  if (error instanceof ClinicaApiError) {
    if (error.status === 409) {
      return 'Já existe uma origem com este nome.';
    }
    return error.message;
  }
  return 'Não foi possível concluir a operação.';
}

export type { PatientReferralOrigin };
