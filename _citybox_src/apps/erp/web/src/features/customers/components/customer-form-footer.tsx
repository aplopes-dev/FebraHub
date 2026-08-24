"use client";

import { EntityFormFooter } from "@/components/ui/form/entity-form-footer";

type CustomerFormFooterProps = {
  isDirty: boolean;
  hasSavedOnce: boolean;
  isSaving?: boolean;
  onDiscard: () => void;
  onSave: () => void;
};

export function CustomerFormFooter({
  isDirty,
  hasSavedOnce,
  isSaving = false,
  onDiscard,
  onSave,
}: CustomerFormFooterProps) {
  return (
    <EntityFormFooter
      mode="dirty"
      ariaLabel="Ações do formulário de cliente"
      isDirty={isDirty}
      hasSavedOnce={hasSavedOnce}
      isSaving={isSaving}
      savedMessage="Cliente salvo"
      onCancel={() => {}}
      onDiscard={onDiscard}
      onSave={onSave}
    />
  );
}
