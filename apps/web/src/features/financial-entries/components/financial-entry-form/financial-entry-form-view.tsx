"use client";

import { useRouter } from "next/navigation";
import { Page } from "@/components/ui/page";
import { useState } from "react";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import { toast } from "@/ui";
import { EntityFormHeader } from "@/components/ui/form/entity-form-header";
import {
  FinancialEntryFinancialSection,
  type FinancialEntryCardSettlementInfo,
} from "@/features/financial-entries/components/financial-entry-form/financial-entry-financial-section";
import { FinancialEntryPaymentsSection } from "@/features/financial-entries/components/financial-entry-form/financial-entry-payments-section";
import { FinancialEntryPartySection } from "@/features/financial-entries/components/financial-entry-form/financial-entry-party-section";
import { FinancialEntryAllocationsSection } from "@/features/financial-entries/components/financial-entry-form/financial-entry-allocations-section";
import { FinancialEntryFormFooter } from "@/features/financial-entries/components/financial-entry-form/financial-entry-form-footer";
import { useFinancialEntryForm } from "@/features/financial-entries/hooks/use-financial-entry-form";
import {
  useCreateFinancialEntryMutation,
  useUpdateFinancialEntryMutation,
} from "@/features/financial-entries/hooks/use-financial-entry-mutations";
import {
  computeEntryTotal,
  sumAllocations,
  type FinancialEntryFormValues,
} from "@/features/financial-entries/lib/financial-entry-form-values";

const LIST_PATH = "/financas/lancamentos";
const ALLOCATION_TOLERANCE = 0.01;

type FinancialEntryFormViewProps = {
  /** Presente = modo edição. */
  entryId?: string;
  initialValues?: FinancialEntryFormValues;
  /** Lançamento vinculado a pedido de venda — travado por completo (FR-016). */
  readOnly?: boolean;
  /** Presente só em lançamentos gerados pelo motor de recebíveis do cartão. */
  cardSettlement?: FinancialEntryCardSettlementInfo | null;
};

export function FinancialEntryFormView({
  entryId,
  initialValues,
  readOnly = false,
  cardSettlement = null,
}: FinancialEntryFormViewProps) {
  const router = useRouter();
  const isEdit = entryId != null;
  const [showValidation, setShowValidation] = useState(false);

  const {
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
  } = useFinancialEntryForm({ initialValues });

  const createMutation = useCreateFinancialEntryMutation();
  const updateMutation = useUpdateFinancialEntryMutation();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  function validate(): boolean {
    if (!values.bankAccountId) {
      toast.error("Selecione a conta bancária do lançamento.");
      return false;
    }
    if (!values.competenceDate || !values.dueDate) {
      toast.error("Informe as datas de competência e de vencimento.");
      return false;
    }
    if (!values.description.trim()) {
      toast.error("Informe a descrição do lançamento.");
      return false;
    }
    if (values.allocations.some((allocation) => !allocation.costCenterId)) {
      toast.error("Informe o centro de custo em todas as linhas de rateio.");
      return false;
    }

    const total = computeEntryTotal(values);
    const allocated = sumAllocations(values.allocations);
    if (Math.abs(total - allocated) > ALLOCATION_TOLERANCE) {
      toast.error(
        "O rateio por categoria precisa somar o valor total do lançamento.",
      );
      return false;
    }

    return true;
  }

  async function handleSave() {
    if (readOnly) return;
    setShowValidation(true);
    if (!validate()) return;

    try {
      const saved =
        isEdit && entryId
          ? await updateMutation.mutateAsync({ id: entryId, values })
          : await createMutation.mutateAsync(values);

      if (hasPendingAttachmentChanges) {
        try {
          await syncAttachments(saved.id);
        } catch {
          toast.error(
            "Lançamento salvo, mas houve um problema ao sincronizar os anexos.",
          );
        }
      }

      markSaved();
      router.push(LIST_PATH);
    } catch {
      // toast de erro já disparado pela mutation (onError)
    }
  }

  return (
    <Page
      footer={
        readOnly ? null : (
          <FinancialEntryFormFooter
            isDirty={isDirty}
            hasSavedOnce={hasSavedOnce}
            isSaving={isSaving}
            onDiscard={discard}
            onSave={handleSave}
          />
        )
      }
    >
      <Stack
        spacing={4}
        sx={{ minWidth: 0, maxWidth: "100%" }}
      >
        <EntityFormHeader
          title={isEdit ? "Editar lançamento" : "Novo lançamento"}
          subtitle="Lançamento"
          backHref={LIST_PATH}
        />

        {readOnly ? (
          <Alert severity="info">
            Este lançamento foi gerado por um pedido de venda e está
            disponível apenas para visualização.
          </Alert>
        ) : null}

        <Stack
          spacing={4}
          sx={readOnly ? { pointerEvents: "none", opacity: 0.92 } : undefined}
        >
          <FinancialEntryFinancialSection
            values={values}
            onFieldChange={setField}
            readOnly={readOnly}
            cardSettlement={cardSettlement}
          />

          <FinancialEntryPaymentsSection
            values={values}
            onAdd={addPayment}
            onRemove={removePayment}
            onUpdate={updatePayment}
            readOnly={readOnly}
          />

          <FinancialEntryPartySection
            values={values}
            onFieldChange={setField}
            readOnly={readOnly}
          />

          <FinancialEntryAllocationsSection
            values={values}
            onAddAllocation={addAllocation}
            onRemoveAllocation={removeAllocation}
            onUpdateAllocationField={updateAllocationField}
            onUpdateAllocationAmount={updateAllocationAmount}
            onUpdateAllocationPercentage={updateAllocationPercentage}
            financialEntryId={entryId ?? null}
            pendingAttachmentFiles={pendingAttachmentFiles}
            onAddAttachmentFiles={addPendingAttachmentFiles}
            onRemovePendingAttachmentFile={removePendingAttachmentFile}
            onRemoveExistingAttachment={removeExistingAttachment}
            readOnly={readOnly}
            showValidation={showValidation}
          />
        </Stack>
      </Stack>
    </Page>
  );
}
