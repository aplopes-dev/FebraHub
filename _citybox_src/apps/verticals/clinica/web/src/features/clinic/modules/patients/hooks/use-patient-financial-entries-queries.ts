'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClinicaApiError } from '@/features/clinic/shared/api';
import { commissionsKeys } from '@/features/clinic/financeiro/comissoes/hooks/use-commissions-queries';
import { useStore } from '@/lib/store-context';
import {
  createAvulsoDebit,
  deletePatientFinancialEntry,
  deletePatientFinancialEntryAttachment,
  listPatientFinancialEntries,
  patientFinancialEntryAttachmentContentPath,
  receivePatientFinancialEntry,
  updatePendingDebit,
} from '../services/patient-financial-entries.service';
import { toPatientPhotoUrl } from '../lib/patient-api-mappers';
import { financialEntryKeys } from './query-keys';
import type { PatientFinancialDebitFormValues } from '../types/patient-financial-debit-form';
import type { PatientFinancialEntryListParams } from '../types/patient-financial-entry-api';
import type { PatientFinancialReceiveFormValues } from '../types/patient-financial-receive-form';

export function usePatientFinancialEntriesQuery(
  patientId: string | null,
  params: PatientFinancialEntryListParams = {},
) {
  const { storeId } = useStore();

  return useQuery({
    queryKey: financialEntryKeys.list(storeId ?? '', patientId ?? '', params),
    queryFn: () => listPatientFinancialEntries(storeId!, patientId!, params),
    enabled: Boolean(storeId) && Boolean(patientId),
    placeholderData: keepPreviousData,
  });
}

export function usePatientFinancialEntryMutations(patientId: string | null) {
  const { storeId } = useStore();
  const queryClient = useQueryClient();

  const invalidate = () => {
    if (!storeId || !patientId) return;
    void queryClient.invalidateQueries({
      queryKey: financialEntryKeys.all(storeId, patientId),
    });
  };

  const invalidateAfterReceive = () => {
    invalidate();
    if (!storeId) return;
    void queryClient.invalidateQueries({
      queryKey: commissionsKeys.all(storeId),
    });
  };

  const createMutation = useMutation({
    mutationFn: (values: PatientFinancialDebitFormValues) =>
      createAvulsoDebit(storeId!, patientId!, values),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      entryId,
      values,
    }: {
      entryId: string;
      values: PatientFinancialDebitFormValues;
    }) => updatePendingDebit(storeId!, patientId!, entryId, values),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (entryId: string) =>
      deletePatientFinancialEntry(storeId!, patientId!, entryId),
    onSuccess: invalidate,
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: ({
      entryId,
      attachmentId,
    }: {
      entryId: string;
      attachmentId: string;
    }) =>
      deletePatientFinancialEntryAttachment(
        storeId!,
        patientId!,
        entryId,
        attachmentId,
      ),
    onSuccess: invalidate,
  });

  const receiveMutation = useMutation({
    mutationFn: ({
      entryId,
      values,
    }: {
      entryId: string;
      values: PatientFinancialReceiveFormValues;
    }) => receivePatientFinancialEntry(storeId!, patientId!, entryId, values),
    onSuccess: invalidateAfterReceive,
  });

  const buildAttachmentDownloadUrl = (entryId: string, attachmentId: string) => {
    if (!storeId || !patientId) return null;
    return toPatientPhotoUrl(
      storeId,
      patientFinancialEntryAttachmentContentPath(patientId, entryId, attachmentId),
    );
  };

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    deleteAttachmentMutation,
    receiveMutation,
    buildAttachmentDownloadUrl,
  };
}

export function getPatientFinancialEntryMutationErrorMessage(error: unknown): string {
  if (error instanceof ClinicaApiError) {
    return error.message;
  }

  return 'Não foi possível salvar o lançamento. Tente novamente.';
}
