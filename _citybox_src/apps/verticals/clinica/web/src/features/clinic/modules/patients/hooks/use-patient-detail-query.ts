'use client';

import { useQuery } from '@tanstack/react-query';
import { getPatientById } from '../services/patients.service';
import { patientKeys } from './query-keys';

export function usePatientDetailQuery(
  storeId: string | null,
  patientId: string | null,
  enabled = true,
) {
  return useQuery({
    queryKey: patientKeys.detail(storeId ?? '', patientId ?? ''),
    queryFn: () => getPatientById(storeId!, patientId!),
    enabled: Boolean(storeId) && Boolean(patientId) && enabled,
  });
}
