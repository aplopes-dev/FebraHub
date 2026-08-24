'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClinicaApiError } from '@/features/clinic/shared/api';
import {
  createPatientCategory,
  deletePatientCategory,
  listPatientCategories,
  updatePatientCategory,
} from '../services/patient-categories.service';
import { patientKeys } from './query-keys';
import type { PatientCategory, PatientCategoryInput } from '../types/patient-category';

export function usePatientCategoriesQuery(storeId: string | null) {
  return useQuery({
    queryKey: patientKeys.categories(storeId ?? ''),
    queryFn: () => listPatientCategories(storeId!),
    enabled: Boolean(storeId),
  });
}

export function usePatientCategoryMutations(storeId: string | null) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    if (!storeId) return;
    void queryClient.invalidateQueries({ queryKey: patientKeys.categories(storeId) });
  };

  const createMutation = useMutation({
    mutationFn: (input: PatientCategoryInput) => createPatientCategory(storeId!, input),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: PatientCategoryInput }) =>
      updatePatientCategory(storeId!, id, input),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePatientCategory(storeId!, id),
    onSuccess: invalidate,
  });

  return { createMutation, updateMutation, deleteMutation };
}

export function getCategoryErrorMessage(error: unknown): string {
  if (error instanceof ClinicaApiError) {
    if (error.status === 409) {
      return 'Não foi possível excluir esta categoria. Ela pode estar protegida ou vinculada a pacientes.';
    }
    return error.message;
  }
  return 'Não foi possível concluir a operação.';
}

export type { PatientCategory };
