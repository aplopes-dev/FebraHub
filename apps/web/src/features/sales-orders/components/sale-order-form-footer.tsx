"use client";

import { EntityFormFooter } from "@/components/ui/form/entity-form-footer";

type SaleOrderFormFooterProps = {
  isDirty: boolean;
  hasSavedOnce: boolean;
  isSaving?: boolean;
  savedLabel?: string;
  onDiscard: () => void;
  onSave: () => void;
};

export function SaleOrderFormFooter({
  isDirty,
  hasSavedOnce,
  isSaving = false,
  savedLabel = "Pedido salvo",
  onDiscard,
  onSave,
}: SaleOrderFormFooterProps) {
  return (
    <EntityFormFooter
      mode="dirty"
      ariaLabel="Ações do formulário de pedido de venda"
      isDirty={isDirty}
      hasSavedOnce={hasSavedOnce}
      isSaving={isSaving}
      savedMessage={savedLabel}
      onCancel={() => {}}
      onDiscard={onDiscard}
      onSave={onSave}
    />
  );
}
