"use client";

import { EntityFormFooter } from "@/components/ui/form/entity-form-footer";

type StockTransferFormFooterProps = {
  isDirty: boolean;
  hasSavedOnce: boolean;
  isSaving?: boolean;
  onDiscard: () => void;
  onSave: () => void;
};

export function StockTransferFormFooter({
  isDirty,
  hasSavedOnce,
  isSaving = false,
  onDiscard,
  onSave,
}: StockTransferFormFooterProps) {
  return (
    <EntityFormFooter
      mode="dirty"
      ariaLabel="Ações do formulário de transferência"
      isDirty={isDirty}
      hasSavedOnce={hasSavedOnce}
      savedMessage="Transferência salva"
      isSaving={isSaving}
      onCancel={() => {}}
      onSave={onSave}
      onDiscard={onDiscard}
    />
  );
}
