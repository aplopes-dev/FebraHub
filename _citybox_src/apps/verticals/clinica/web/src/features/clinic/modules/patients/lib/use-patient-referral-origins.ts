'use client';

import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useStore } from '@/lib/store-context';
import {
  getReferralOriginErrorMessage,
  usePatientReferralOriginMutations,
  usePatientReferralOriginsQuery,
} from '../hooks/use-patient-referral-origins-query';
import type {
  PatientReferralOrigin,
  PatientReferralOriginInput,
} from '../types/patient-referral-origin';

export function usePatientReferralOrigins() {
  const { storeId } = useStore();
  const originsQuery = usePatientReferralOriginsQuery(storeId);
  const { createMutation } = usePatientReferralOriginMutations(storeId);

  const referralOrigins = useMemo(() => originsQuery.data ?? [], [originsQuery.data]);

  const addReferralOrigin = useCallback(
    async (input: PatientReferralOriginInput): Promise<PatientReferralOrigin> => {
      if (!storeId) {
        throw new Error('Loja não selecionada.');
      }
      try {
        return await createMutation.mutateAsync(input);
      } catch (error) {
        toast.error(getReferralOriginErrorMessage(error));
        throw error;
      }
    },
    [createMutation, storeId],
  );

  return {
    referralOrigins,
    isLoading: originsQuery.isLoading,
    addReferralOrigin,
  };
}
