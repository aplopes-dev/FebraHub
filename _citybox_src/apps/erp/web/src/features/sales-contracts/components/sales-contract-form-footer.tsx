"use client";

import { EntityFormFooter } from "@/components/ui/form/entity-form-footer";

type SalesContractFormFooterProps = {
  isDirty: boolean;
  hasSavedOnce: boolean;
  savedLabel?: string;
  onDiscard: () => void;
  onSave: () => void;
};

export function SalesContractFormFooter({
  isDirty,
  hasSavedOnce,
  savedLabel = "Contrato salvo",
  onDiscard,
  onSave,
}: SalesContractFormFooterProps) {
  return (
    <EntityFormFooter
      mode="dirty"
      ariaLabel="Ações do formulário de contrato"
      isDirty={isDirty}
      hasSavedOnce={hasSavedOnce}
      savedMessage={savedLabel}
      onCancel={() => {}}
      onDiscard={onDiscard}
      onSave={onSave}
    />
  );
}
