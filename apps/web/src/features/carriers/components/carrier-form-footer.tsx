"use client";

import { EntityFormFooter } from "@/components/ui/form/entity-form-footer";

type CarrierFormFooterProps = {
  isDirty: boolean;
  hasSavedOnce: boolean;
  isSaving?: boolean;
  onDiscard: () => void;
  onSave: () => void;
};

export function CarrierFormFooter({
  isDirty,
  hasSavedOnce,
  isSaving = false,
  onDiscard,
  onSave,
}: CarrierFormFooterProps) {
  return (
    <EntityFormFooter
      mode="dirty"
      ariaLabel="Ações do formulário de transportadora"
      isDirty={isDirty}
      hasSavedOnce={hasSavedOnce}
      isSaving={isSaving}
      savedMessage="Transportadora salva"
      onCancel={() => undefined}
      onSave={onSave}
      onDiscard={onDiscard}
    />
  );
}
