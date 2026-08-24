"use client";

import { EntityFormFooter } from "@/components/ui/form/entity-form-footer";

type SupplierFormFooterProps = {
  isDirty: boolean;
  hasSavedOnce: boolean;
  isSaving?: boolean;
  onDiscard: () => void;
  onSave: () => void;
};

export function SupplierFormFooter({
  isDirty,
  hasSavedOnce,
  isSaving = false,
  onDiscard,
  onSave,
}: SupplierFormFooterProps) {
  return (
    <EntityFormFooter
      mode="dirty"
      ariaLabel="Ações do formulário de fornecedor"
      isDirty={isDirty}
      hasSavedOnce={hasSavedOnce}
      isSaving={isSaving}
      savedMessage="Fornecedor salvo"
      onCancel={() => undefined}
      onSave={onSave}
      onDiscard={onDiscard}
    />
  );
}
