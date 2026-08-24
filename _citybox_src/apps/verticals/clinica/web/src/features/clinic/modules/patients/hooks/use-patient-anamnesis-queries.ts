'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClinicaApiError } from '@/features/clinic/shared/api';
import { useStore } from '@/lib/store-context';
import {
  evaluatePatientAnamnesisAlerts,
  mergePatientAnamnesisAlerts,
} from '../lib/evaluate-patient-anamnesis-alerts';
import {
  createPatientAnamnesisFromDraft,
  deletePatientAnamnesis,
  getPatientAnamnesisById,
  listPatientAnamneses,
} from '../services/patient-anamnesis.service';
import { anamnesisKeys } from './query-keys';
import type { PatientAnamnesisAnswer } from '../types/patient-anamnesis';
import type { PatientAnamnesisListParams } from '../types/patient-anamnesis-api';

export function usePatientAnamnesesQuery(
  patientId: string | null,
  params: PatientAnamnesisListParams = {},
) {
  const { storeId } = useStore();

  return useQuery({
    queryKey: anamnesisKeys.list(storeId ?? '', patientId ?? '', params),
    queryFn: () => listPatientAnamneses(storeId!, patientId!, params),
    enabled: Boolean(storeId) && Boolean(patientId),
    placeholderData: keepPreviousData,
  });
}

export function usePatientAnamnesisDetailQuery(
  patientId: string | null,
  anamnesisId: string | null,
  enabled = true,
) {
  const { storeId } = useStore();

  return useQuery({
    queryKey: anamnesisKeys.detail(storeId ?? '', patientId ?? '', anamnesisId ?? ''),
    queryFn: () => getPatientAnamnesisById(storeId!, patientId!, anamnesisId!),
    enabled: Boolean(storeId) && Boolean(patientId) && Boolean(anamnesisId) && enabled,
  });
}

export function usePatientAnamnesisAlertsQuery(patientId: string | null) {
  const { storeId } = useStore();

  return useQuery({
    queryKey: anamnesisKeys.alerts(storeId ?? '', patientId ?? ''),
    queryFn: async () => {
      const { items } = await listPatientAnamneses(storeId!, patientId!, {
        perPage: 100,
        sortBy: 'issuedAt',
        sortOrder: 'desc',
      });

      const issued = items.filter((item) => item.status === 'issued');
      const details = await Promise.all(
        issued.map((item) => getPatientAnamnesisById(storeId!, patientId!, item.id)),
      );

      const alertGroups = details
        .filter((anamnesis) => anamnesis.answers?.length)
        .map((anamnesis) =>
          evaluatePatientAnamnesisAlerts(
            anamnesis.id,
            anamnesis.answers ?? [],
            anamnesis.questionsSnapshot ?? [],
          ),
        );

      return mergePatientAnamnesisAlerts(alertGroups);
    },
    enabled: Boolean(storeId) && Boolean(patientId),
  });
}

export function usePatientAnamnesisMutations(patientId: string | null) {
  const { storeId } = useStore();
  const queryClient = useQueryClient();

  const invalidate = () => {
    if (!storeId || !patientId) return;
    void queryClient.invalidateQueries({
      queryKey: anamnesisKeys.all(storeId, patientId),
    });
  };

  const createMutation = useMutation({
    mutationFn: (input: {
      templateId: string;
      fillingMode: 'professional' | 'patient';
      consultationReason?: string;
      answers?: Record<string, PatientAnamnesisAnswer>;
    }) => createPatientAnamnesisFromDraft(storeId!, patientId!, input),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (anamnesisId: string) =>
      deletePatientAnamnesis(storeId!, patientId!, anamnesisId),
    onSuccess: invalidate,
  });

  return { createMutation, deleteMutation };
}

export function getPatientAnamnesisMutationErrorMessage(error: unknown): string {
  if (error instanceof ClinicaApiError) {
    return error.message;
  }

  return 'Não foi possível salvar a anamnese. Tente novamente.';
}

export function formatPatientAnamnesisAlertsCount(count: number): string {
  return `${count} alerta${count === 1 ? '' : 's'}`;
}
