'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClinicaApiError } from '@/features/clinic/shared/api';
import { useStore } from '@/lib/store-context';
import {
  createPatientEvolution,
  deletePatientEvolution,
  getPatientEvolutionHistory,
  listPatientEvolutions,
  updatePatientEvolution,
} from '../services/patient-evolutions.service';
import { evolutionKeys } from './query-keys';
import type { PatientStandaloneEvolutionPayload } from '../types/patient-treatment';

export function usePatientEvolutionsQuery(patientId: string | null, enabled = true) {
  const { storeId } = useStore();

  return useQuery({
    queryKey: evolutionKeys.list(storeId ?? '', patientId ?? ''),
    queryFn: () => listPatientEvolutions(storeId!, patientId!),
    enabled: Boolean(storeId) && Boolean(patientId) && enabled,
  });
}

export function usePatientEvolutionHistoryQuery(
  patientId: string | null,
  evolutionId: string | null,
  enabled = true,
) {
  const { storeId } = useStore();

  return useQuery({
    queryKey: evolutionKeys.history(storeId ?? '', patientId ?? '', evolutionId ?? ''),
    queryFn: () => getPatientEvolutionHistory(storeId!, patientId!, evolutionId!),
    enabled: Boolean(storeId) && Boolean(patientId) && Boolean(evolutionId) && enabled,
  });
}

export function usePatientEvolutionMutations(patientId: string | null) {
  const { storeId } = useStore();
  const queryClient = useQueryClient();

  const invalidate = () => {
    if (!storeId || !patientId) return;
    void queryClient.invalidateQueries({
      queryKey: evolutionKeys.all(storeId, patientId),
    });
  };

  const createMutation = useMutation({
    mutationFn: (payload: PatientStandaloneEvolutionPayload) =>
      createPatientEvolution(storeId!, patientId!, payload),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      evolutionId,
      payload,
    }: {
      evolutionId: string;
      payload: PatientStandaloneEvolutionPayload;
    }) => updatePatientEvolution(storeId!, patientId!, evolutionId, payload),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (evolutionId: string) =>
      deletePatientEvolution(storeId!, patientId!, evolutionId),
    onSuccess: invalidate,
  });

  return { createMutation, updateMutation, deleteMutation };
}

export function getPatientEvolutionMutationErrorMessage(error: unknown): string {
  if (error instanceof ClinicaApiError) {
    return error.message;
  }

  return 'Não foi possível salvar a evolução. Tente novamente.';
}
