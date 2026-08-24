"use client";

import { useCallback, useMemo, useState } from "react";
import {
  deleteFinancialEntryAttachmentApi,
  uploadFinancialEntryAttachmentApi,
} from "@/features/financial-entries/api/financial-entries.service";
import {
  amountFromPercentage,
  areFinancialEntryFormValuesEqual,
  createEmptyAllocation,
  createEmptyFinancialEntryFormValues,
  createEmptyPayment,
  percentageFromAmount,
  type FinancialEntryFormValues,
} from "@/features/financial-entries/lib/financial-entry-form-values";
import type { FinancialEntryPayment } from "@/features/financial-entries/types/financial-entry";

type UseFinancialEntryFormOptions = {
  initialValues?: FinancialEntryFormValues;
};

export function useFinancialEntryForm({
  initialValues,
}: UseFinancialEntryFormOptions) {
  const initial = initialValues ?? createEmptyFinancialEntryFormValues();
  const [values, setValues] = useState<FinancialEntryFormValues>(initial);
  const [baseline, setBaseline] = useState<FinancialEntryFormValues>(initial);
  const [hasSavedOnce, setHasSavedOnce] = useState(false);
  // Arquivos de anexo pendentes de upload/remoção — ver bloco "Anexos" abaixo.
  const [pendingAttachmentFiles, setPendingAttachmentFiles] = useState<
    File[]
  >([]);
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState<string[]>(
    [],
  );

  const isDirty = useMemo(
    () => !areFinancialEntryFormValuesEqual(values, baseline),
    [values, baseline],
  );

  const discard = useCallback(() => {
    setValues({ ...baseline });
    setPendingAttachmentFiles([]);
    setRemovedAttachmentIds([]);
  }, [baseline]);

  /** Chamado pelo form-view após persistir com sucesso (create/update). */
  const markSaved = useCallback(() => {
    setBaseline({ ...values });
    setHasSavedOnce(true);
  }, [values]);

  const setField = useCallback(
    <K extends keyof FinancialEntryFormValues>(
      field: K,
      value: FinancialEntryFormValues[K],
    ) => {
      setValues((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  // Pagamentos (rateio de recebimento/pagamento).
  const addPayment = useCallback(() => {
    setValues((prev) => ({
      ...prev,
      payments: [...prev.payments, createEmptyPayment()],
    }));
  }, []);

  const removePayment = useCallback((paymentId: string) => {
    setValues((prev) => {
      if (prev.payments.length <= 1) return prev;
      return {
        ...prev,
        payments: prev.payments.filter((payment) => payment.id !== paymentId),
      };
    });
  }, []);

  const updatePayment = useCallback(
    (paymentId: string, patch: Partial<FinancialEntryPayment>) => {
      setValues((prev) => ({
        ...prev,
        payments: prev.payments.map((payment) =>
          payment.id === paymentId ? { ...payment, ...patch } : payment,
        ),
      }));
    },
    [],
  );

  // Rateio por categoria financeira + centro de custo.
  const addAllocation = useCallback(() => {
    setValues((prev) => ({
      ...prev,
      allocations: [...prev.allocations, createEmptyAllocation()],
    }));
  }, []);

  const removeAllocation = useCallback((allocationId: string) => {
    setValues((prev) => {
      if (prev.allocations.length <= 1) return prev;
      return {
        ...prev,
        allocations: prev.allocations.filter(
          (allocation) => allocation.id !== allocationId,
        ),
      };
    });
  }, []);

  const updateAllocationField = useCallback(
    (
      allocationId: string,
      field: "categoryId" | "costCenterId",
      value: string,
    ) => {
      setValues((prev) => ({
        ...prev,
        allocations: prev.allocations.map((allocation) =>
          allocation.id === allocationId
            ? { ...allocation, [field]: value }
            : allocation,
        ),
      }));
    },
    [],
  );

  const updateAllocationAmount = useCallback(
    (allocationId: string, amount: number, total: number) => {
      const safeAmount = Math.max(0, amount);
      setValues((prev) => ({
        ...prev,
        allocations: prev.allocations.map((allocation) =>
          allocation.id === allocationId
            ? {
                ...allocation,
                amount: safeAmount,
                percentage: percentageFromAmount(total, safeAmount),
              }
            : allocation,
        ),
      }));
    },
    [],
  );

  const updateAllocationPercentage = useCallback(
    (allocationId: string, percentage: number, total: number) => {
      const safePercentage = Math.min(100, Math.max(0, percentage));
      setValues((prev) => ({
        ...prev,
        allocations: prev.allocations.map((allocation) =>
          allocation.id === allocationId
            ? {
                ...allocation,
                percentage: safePercentage,
                amount: amountFromPercentage(total, safePercentage),
              }
            : allocation,
        ),
      }));
    },
    [],
  );

  // Anexos: `values.attachments` só guarda os já persistidos (metadados reais
  // vindos da API). Arquivos novos ficam pendentes localmente — o upload só
  // acontece depois que o lançamento existe (precisa do id), via
  // `syncAttachments`, chamado pelo form-view após o save principal (mesmo
  // padrão de `syncImage` em `features/products`: falha no anexo não desfaz
  // o lançamento já salvo).
  const addPendingAttachmentFiles = useCallback((files: File[]) => {
    setPendingAttachmentFiles((prev) => [...prev, ...files]);
  }, []);

  const removePendingAttachmentFile = useCallback((index: number) => {
    setPendingAttachmentFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const removeExistingAttachment = useCallback((attachmentId: string) => {
    setValues((prev) => ({
      ...prev,
      attachments: prev.attachments.filter(
        (attachment) => attachment.id !== attachmentId,
      ),
    }));
    setRemovedAttachmentIds((prev) => [...prev, attachmentId]);
  }, []);

  const syncAttachments = useCallback(
    async (entryId: string) => {
      await Promise.all([
        ...removedAttachmentIds.map((id) =>
          deleteFinancialEntryAttachmentApi(entryId, id),
        ),
        ...pendingAttachmentFiles.map((file) =>
          uploadFinancialEntryAttachmentApi(entryId, file),
        ),
      ]);
      setPendingAttachmentFiles([]);
      setRemovedAttachmentIds([]);
    },
    [pendingAttachmentFiles, removedAttachmentIds],
  );

  const hasPendingAttachmentChanges =
    pendingAttachmentFiles.length > 0 || removedAttachmentIds.length > 0;

  return {
    values,
    setField,
    isDirty,
    hasSavedOnce,
    discard,
    markSaved,
    addPayment,
    removePayment,
    updatePayment,
    addAllocation,
    removeAllocation,
    updateAllocationField,
    updateAllocationAmount,
    updateAllocationPercentage,
    pendingAttachmentFiles,
    addPendingAttachmentFiles,
    removePendingAttachmentFile,
    removeExistingAttachment,
    syncAttachments,
    hasPendingAttachmentChanges,
  };
}

export type FinancialEntryForm = ReturnType<typeof useFinancialEntryForm>;
