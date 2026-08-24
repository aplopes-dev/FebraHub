'use client';

import { useQuery } from '@tanstack/react-query';
import { useStore } from '@/lib/store-context';
import { listPatientSignatures } from '../services/electronic-signatures.service';
import {
  patientSignatureKeys,
  type PatientPendingSignaturesListParams,
} from './query-keys';

const DEFAULT_PARAMS: PatientPendingSignaturesListParams = {
  status: 'pending',
  page: 1,
  perPage: 50,
};

export function usePatientPendingSignaturesQuery(
  patientId: string | null,
  params: PatientPendingSignaturesListParams = DEFAULT_PARAMS,
  enabled = true,
) {
  const { storeId } = useStore();
  const merged = { ...DEFAULT_PARAMS, ...params };

  return useQuery({
    queryKey: patientSignatureKeys.list(storeId ?? '', patientId ?? '', merged),
    queryFn: () => listPatientSignatures(storeId!, patientId!, merged),
    enabled: Boolean(storeId) && Boolean(patientId) && enabled,
  });
}
