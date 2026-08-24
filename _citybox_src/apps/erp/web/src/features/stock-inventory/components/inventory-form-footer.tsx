"use client";

import { EntityFormFooter } from "@/components/ui/form";

type InventoryFormFooterProps = {
  onCancel: () => void;
  onFinalize: () => void;
  finalizeDisabled?: boolean;
  isSaving?: boolean;
};

export function InventoryFormFooter({
  onCancel,
  onFinalize,
  finalizeDisabled = false,
  isSaving = false,
}: InventoryFormFooterProps) {
  return (
    <EntityFormFooter
      ariaLabel="Ações do inventário"
      mode="simple"
      cancelLabel="Cancelar"
      saveLabel="Finalizar inventário"
      onCancel={onCancel}
      onSave={onFinalize}
      saveDisabled={finalizeDisabled}
      isSaving={isSaving}
    />
  );
}
