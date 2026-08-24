"use client";

import { EntityFormFooter } from "@/components/ui/form";

type StockMovementFormFooterProps = {
  isDirty: boolean;
  hasSavedOnce: boolean;
  isSaving?: boolean;
  onDiscard: () => void;
  onSave: () => void;
};

export function StockMovementFormFooter({
  isDirty,
  hasSavedOnce,
  isSaving = false,
  onDiscard,
  onSave,
}: StockMovementFormFooterProps) {
  return (
    <EntityFormFooter
      mode="dirty"
      ariaLabel="Ações do formulário de movimentação"
      isDirty={isDirty}
      hasSavedOnce={hasSavedOnce}
      isSaving={isSaving}
      savedMessage="Movimentação salva"
      onCancel={() => undefined}
      onSave={onSave}
      onDiscard={onDiscard}
    />
  );
}
