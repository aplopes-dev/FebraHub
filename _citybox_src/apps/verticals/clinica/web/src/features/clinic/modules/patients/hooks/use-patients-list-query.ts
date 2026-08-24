'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { listPatients } from '../services/patients.service';
import { patientKeys } from './query-keys';
import type { PatientListParams } from '../types/patient-api';

export function usePatientsListQuery(
  storeId: string | null,
  params: PatientListParams,
  enabled = true,
) {
  return useQuery({
    queryKey: patientKeys.list(storeId ?? '', params),
    queryFn: () => listPatients(storeId!, params),
    enabled: Boolean(storeId) && enabled,
    placeholderData: keepPreviousData,
  });
}
