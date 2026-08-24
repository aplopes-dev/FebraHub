"use client";

import { EntityFormFooter } from "@/components/ui/form/entity-form-footer";

type StockFormFooterProps = {
  onCancel: () => void;
  onSave: () => void;
};

export function StockFormFooter({ onCancel, onSave }: StockFormFooterProps) {
  return (
    <EntityFormFooter
      mode="simple"
      ariaLabel="Ações do formulário de estoque"
      onCancel={onCancel}
      onSave={onSave}
    />
  );
}
