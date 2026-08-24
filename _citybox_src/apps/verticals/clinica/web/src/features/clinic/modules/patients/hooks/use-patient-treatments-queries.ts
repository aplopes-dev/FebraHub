'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClinicaApiError } from '@/features/clinic/shared/api';
import { useStore } from '@/lib/store-context';
import type { ClinicPlanLocationUiType } from '@/features/clinic/modules/settings/plans/data/specialty-location-ui-type';
import {
  createPatientTreatmentsFromDraft,
  deletePatientTreatment,
  finalizePatientTreatments,
  getPatientNutritionInitiation,
  initializePatientNutrition,
  listPatientNutritionInitiations,
  listPatientTreatments,
  reorderPatientTreatments,
  updatePatientTreatment,
} from '../services/patient-treatments.service';
import { treatmentKeys, evolutionKeys, anamnesisKeys } from './query-keys';
import { commissionsKeys } from '@/features/clinic/financeiro/comissoes/hooks/use-commissions-queries';
import type {
  PatientStandaloneTreatmentDraft,
  PatientTreatmentEditFormValues,
  PatientTreatmentFinalizePayload,
} from '../types/patient-treatment';
import type { PatientNutritionInitPayload } from '../types/patient-nutrition-init';

export function usePatientTreatmentsQuery(patientId: string | null) {
  const { storeId } = useStore();

  return useQuery({
    queryKey: treatmentKeys.list(storeId ?? '', patientId ?? ''),
    queryFn: () => listPatientTreatments(storeId!, patientId!),
    enabled: Boolean(storeId) && Boolean(patientId),
  });
}

/** Metadados dos atendimentos nutricionais — alimentam o card da evolução. */
export function usePatientNutritionInitiationsQuery(
  patientId: string | null,
  enabled: boolean,
) {
  const { storeId } = useStore();

  return useQuery({
    queryKey: treatmentKeys.nutritionInits(storeId ?? '', patientId ?? ''),
    queryFn: () => listPatientNutritionInitiations(storeId!, patientId!),
    enabled: enabled && Boolean(storeId) && Boolean(patientId),
  });
}

/** Conteúdo completo de um atendimento nutricional — usado na comparação. */
export function usePatientNutritionInitiationQuery(
  patientId: string | null,
  evolutionId: string | null,
) {
  const { storeId } = useStore();

  return useQuery({
    queryKey: treatmentKeys.nutritionInit(
      storeId ?? '',
      patientId ?? '',
      evolutionId ?? '',
    ),
    queryFn: () => getPatientNutritionInitiation(storeId!, patientId!, evolutionId!),
    enabled: Boolean(storeId) && Boolean(patientId) && Boolean(evolutionId),
  });
}

export function usePatientTreatmentMutations(patientId: string | null) {
  const { storeId } = useStore();
  const queryClient = useQueryClient();

  const invalidate = () => {
    if (!storeId || !patientId) return;
    void queryClient.invalidateQueries({
      queryKey: treatmentKeys.all(storeId, patientId),
    });
    void queryClient.invalidateQueries({
      queryKey: evolutionKeys.all(storeId, patientId),
    });
    void queryClient.invalidateQueries({
      queryKey: anamnesisKeys.all(storeId, patientId),
    });
  };

  const createMutation = useMutation({
    mutationFn: ({
      draft,
      professionalName,
      locationUiType,
    }: {
      draft: PatientStandaloneTreatmentDraft;
      professionalName: string;
      locationUiType?: ClinicPlanLocationUiType;
    }) =>
      createPatientTreatmentsFromDraft(
        storeId!,
        patientId!,
        draft,
        professionalName,
        locationUiType,
      ),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      treatmentId,
      values,
    }: {
      treatmentId: string;
      values: PatientTreatmentEditFormValues;
    }) => updatePatientTreatment(storeId!, patientId!, treatmentId, values),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (treatmentId: string) =>
      deletePatientTreatment(storeId!, patientId!, treatmentId),
    onSuccess: invalidate,
  });

  const reorderMutation = useMutation({
    mutationFn: (orderedIds: string[]) =>
      reorderPatientTreatments(storeId!, patientId!, orderedIds),
    onSuccess: invalidate,
  });

  const finalizeMutation = useMutation({
    mutationFn: (payload: PatientTreatmentFinalizePayload) =>
      finalizePatientTreatments(storeId!, patientId!, payload),
    onSuccess: () => {
      invalidate();
      // Finalize gera accrual treatment_completed — Em aberto precisa atualizar
      if (storeId) {
        void queryClient.invalidateQueries({
          queryKey: commissionsKeys.all(storeId),
        });
      }
    },
  });

  const nutritionInitMutation = useMutation({
    mutationFn: (payload: PatientNutritionInitPayload) =>
      initializePatientNutrition(storeId!, patientId!, payload),
    onSuccess: invalidate,
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    reorderMutation,
    finalizeMutation,
    nutritionInitMutation,
  };
}

export function getPatientTreatmentMutationErrorMessage(error: unknown): string {
  if (error instanceof ClinicaApiError) {
    return error.message;
  }

  return 'Não foi possível concluir a operação. Tente novamente.';
}
