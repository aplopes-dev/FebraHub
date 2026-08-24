'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClinicaApiError } from '@/features/clinic/shared/api';
import { useStore } from '@/lib/store-context';
import {
  createPatientBodyRegionAnnotation,
  deletePatientBodyRegionAnnotation,
  listPatientBodyRegionAnnotations,
} from '../services/patient-body-region-annotations.service';
import { bodyRegionAnnotationKeys } from './query-keys';

export function usePatientBodyRegionAnnotationsQuery(patientId: string | null) {
  const { storeId } = useStore();

  return useQuery({
    queryKey: bodyRegionAnnotationKeys.list(storeId ?? '', patientId ?? ''),
    queryFn: () => listPatientBodyRegionAnnotations(storeId!, patientId!),
    enabled: Boolean(storeId) && Boolean(patientId),
  });
}

export function usePatientBodyRegionAnnotationMutations(patientId: string | null) {
  const { storeId } = useStore();
  const queryClient = useQueryClient();

  const invalidate = () => {
    if (!storeId || !patientId) return;
    void queryClient.invalidateQueries({
      queryKey: bodyRegionAnnotationKeys.all(storeId, patientId),
    });
  };

  const createMutation = useMutation({
    mutationFn: (input: {
      bodyRegionId: string;
      content: string;
      professionalName: string;
      professionalId?: string;
    }) => createPatientBodyRegionAnnotation(storeId!, patientId!, input),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (annotationId: string) =>
      deletePatientBodyRegionAnnotation(storeId!, patientId!, annotationId),
    onSuccess: invalidate,
  });

  return { createMutation, deleteMutation };
}

export function getPatientBodyRegionAnnotationMutationErrorMessage(
  error: unknown,
): string {
  if (error instanceof ClinicaApiError) {
    return error.message;
  }

  return 'Não foi possível salvar a anotação. Tente novamente.';
}
