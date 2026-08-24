'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClinicaApiError } from '@/features/clinic/shared/api';
import { useStore } from '@/lib/store-context';
import { bodyMetricKeys } from './query-keys';
import {
  createPatientBodyMetric,
  listPatientBodyMetrics,
  type PatientBodyMetricUpsertBody,
} from '../services/patient-body-metrics.service';

export function usePatientBodyMetricsQuery(
  patientId: string | null,
  params: { page?: number; perPage?: number } = { page: 1, perPage: 10 },
) {
  const { storeId } = useStore();
  const page = params.page ?? 1;
  const perPage = params.perPage ?? 10;

  return useQuery({
    queryKey: bodyMetricKeys.list(storeId ?? '', patientId ?? '', { page, perPage }),
    queryFn: () => listPatientBodyMetrics(storeId!, patientId!, { page, perPage }),
    enabled: Boolean(storeId) && Boolean(patientId),
  });
}

export function usePatientBodyMetricMutations(patientId: string | null) {
  const { storeId } = useStore();
  const queryClient = useQueryClient();

  const invalidate = () => {
    if (!storeId || !patientId) return;
    void queryClient.invalidateQueries({
      queryKey: bodyMetricKeys.all(storeId, patientId),
    });
  };

  const createMutation = useMutation({
    mutationFn: (body: PatientBodyMetricUpsertBody) =>
      createPatientBodyMetric(storeId!, patientId!, body),
    onSuccess: invalidate,
  });

  return { createMutation };
}

export function getPatientBodyMetricMutationErrorMessage(error: unknown): string {
  if (error instanceof ClinicaApiError) {
    return error.message;
  }
  return 'Não foi possível salvar a medição corporal.';
}
