'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClinicaApiError } from '@/features/clinic/shared/api';
import { useStore } from '@/lib/store-context';
import {
  approvePatientBudget,
  createPatientBudget,
  deletePatientBudget,
  duplicatePatientBudget,
  getPatientBudgetById,
  listPatientBudgets,
  updatePatientBudget,
  updatePatientBudgetStatus,
} from '../services/patient-budgets.service';
import { budgetKeys, financialEntryKeys, treatmentKeys } from './query-keys';
import { salesQueryKeys } from '@/features/clinic/vendas/hooks/query-keys';
import type { PatientBudgetStatus } from '../types/patient-budget';
import type { PatientBudgetListParams } from '../types/patient-budget-api';
import type { PatientBudgetSheetSubmitPayload } from '../types/patient-budget-form';

export function usePatientBudgetsQuery(
  patientId: string | null,
  params: PatientBudgetListParams = {},
  enabled = true,
) {
  const { storeId } = useStore();

  return useQuery({
    queryKey: budgetKeys.list(storeId ?? '', patientId ?? '', params),
    queryFn: () => listPatientBudgets(storeId!, patientId!, params),
    enabled: Boolean(storeId) && Boolean(patientId) && enabled,
    placeholderData: keepPreviousData,
  });
}

export function usePatientBudgetDetailQuery(
  patientId: string | null,
  budgetId: string | null,
  enabled = true,
) {
  const { storeId } = useStore();

  return useQuery({
    queryKey: budgetKeys.detail(storeId ?? '', patientId ?? '', budgetId ?? ''),
    queryFn: () => getPatientBudgetById(storeId!, patientId!, budgetId!),
    enabled: Boolean(storeId) && Boolean(patientId) && Boolean(budgetId) && enabled,
  });
}

export function usePatientBudgetMutations(patientId: string | null) {
  const { storeId } = useStore();
  const queryClient = useQueryClient();

  const invalidate = () => {
    if (!storeId || !patientId) return;
    void queryClient.invalidateQueries({
      queryKey: budgetKeys.all(storeId, patientId),
    });
    void queryClient.invalidateQueries({
      queryKey: treatmentKeys.all(storeId, patientId),
    });
    void queryClient.invalidateQueries({
      queryKey: financialEntryKeys.all(storeId, patientId),
    });
    // Sync orçamento → Funil de Venda (create/status/delete no CRM)
    void queryClient.invalidateQueries({
      queryKey: salesQueryKeys.opportunities(storeId),
    });
  };

  const createMutation = useMutation({
    mutationFn: (payload: PatientBudgetSheetSubmitPayload) =>
      createPatientBudget(storeId!, patientId!, payload),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      budgetId,
      payload,
    }: {
      budgetId: string;
      payload: PatientBudgetSheetSubmitPayload;
    }) => updatePatientBudget(storeId!, patientId!, budgetId, payload),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (budgetId: string) => deletePatientBudget(storeId!, patientId!, budgetId),
    onSuccess: invalidate,
  });

  const duplicateMutation = useMutation({
    mutationFn: ({ budgetId, description }: { budgetId: string; description: string }) =>
      duplicatePatientBudget(storeId!, patientId!, budgetId, description),
    onSuccess: invalidate,
  });

  const approveMutation = useMutation({
    mutationFn: ({
      budgetId,
      dueDate,
      installments,
    }: {
      budgetId: string;
      dueDate?: string;
      installments?: Array<{ dueDate: string; valueCents: number }>;
    }) => approvePatientBudget(storeId!, patientId!, budgetId, dueDate, installments),
    onSuccess: invalidate,
  });

  const statusMutation = useMutation({
    mutationFn: ({
      budgetId,
      status,
      rejection,
    }: {
      budgetId: string;
      status: PatientBudgetStatus;
      rejection?: { date: string; reason: string } | null;
    }) =>
      updatePatientBudgetStatus(storeId!, patientId!, budgetId, status, rejection),
    onSuccess: invalidate,
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    duplicateMutation,
    approveMutation,
    statusMutation,
  };
}

export function getPatientBudgetMutationErrorMessage(error: unknown): string {
  if (error instanceof ClinicaApiError) {
    return error.message;
  }

  return 'Não foi possível salvar o orçamento. Tente novamente.';
}
