"use client";

import { EntityFormFooter } from "@/components/ui/form";

type PurchaseFormFooterProps = {
  isDirty: boolean;
  hasSavedOnce: boolean;
  isSaving?: boolean;
  savedLabel?: string;
  onDiscard: () => void;
  onSave: () => void;
};

export function PurchaseFormFooter({
  isDirty,
  hasSavedOnce,
  isSaving = false,
  savedLabel = "Compra salva",
  onDiscard,
  onSave,
}: PurchaseFormFooterProps) {
  return (
    <EntityFormFooter
      mode="dirty"
      ariaLabel="Ações do formulário de compra"
      isDirty={isDirty}
      hasSavedOnce={hasSavedOnce}
      isSaving={isSaving}
      savedMessage={savedLabel}
      onCancel={() => undefined}
      onSave={onSave}
      onDiscard={onDiscard}
    />
  );
}
