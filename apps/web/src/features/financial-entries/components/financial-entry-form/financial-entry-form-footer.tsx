"use client";

import { EntityFormFooter } from "@/components/ui/form/entity-form-footer";

type FinancialEntryFormFooterProps = {
  isDirty: boolean;
  hasSavedOnce: boolean;
  isSaving?: boolean;
  onDiscard: () => void;
  onSave: () => void;
};

export function FinancialEntryFormFooter({
  isDirty,
  hasSavedOnce,
  isSaving,
  onDiscard,
  onSave,
}: FinancialEntryFormFooterProps) {
  return (
    <EntityFormFooter
      mode="dirty"
      ariaLabel="Ações do formulário de lançamento"
      isDirty={isDirty}
      hasSavedOnce={hasSavedOnce}
      isSaving={isSaving}
      savedMessage="Lançamento salvo"
      onCancel={() => {}}
      onDiscard={onDiscard}
      onSave={onSave}
    />
  );
}
