'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClinicaApiError } from '@/features/clinic/shared/api';
import { useStore } from '@/lib/store-context';
import {
  createPatientToothAnnotation,
  deletePatientToothAnnotation,
  listPatientToothAnnotations,
} from '../services/patient-tooth-annotations.service';
import { toothAnnotationKeys } from './query-keys';

export function usePatientToothAnnotationsQuery(patientId: string | null) {
  const { storeId } = useStore();

  return useQuery({
    queryKey: toothAnnotationKeys.list(storeId ?? '', patientId ?? ''),
    queryFn: () => listPatientToothAnnotations(storeId!, patientId!),
    enabled: Boolean(storeId) && Boolean(patientId),
  });
}

export function usePatientToothAnnotationMutations(patientId: string | null) {
  const { storeId } = useStore();
  const queryClient = useQueryClient();

  const invalidate = () => {
    if (!storeId || !patientId) return;
    void queryClient.invalidateQueries({
      queryKey: toothAnnotationKeys.all(storeId, patientId),
    });
  };

  const createMutation = useMutation({
    mutationFn: (input: {
      toothNumber: number;
      content: string;
      professionalName: string;
      professionalId?: string;
    }) => createPatientToothAnnotation(storeId!, patientId!, input),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (annotationId: string) =>
      deletePatientToothAnnotation(storeId!, patientId!, annotationId),
    onSuccess: invalidate,
  });

  return { createMutation, deleteMutation };
}

export function getPatientToothAnnotationMutationErrorMessage(error: unknown): string {
  if (error instanceof ClinicaApiError) {
    return error.message;
  }

  return 'Não foi possível salvar a anotação. Tente novamente.';
}
