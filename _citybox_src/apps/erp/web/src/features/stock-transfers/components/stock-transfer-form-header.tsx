"use client";

import {
  EntityFormHeader,
  type EntityFormHeaderProps,
} from "@/components/ui/form/entity-form-header";

export type StockTransferFormHeaderProps = Partial<
  Omit<EntityFormHeaderProps, "backHref">
> & {
  backHref?: string;
};

export function StockTransferFormHeader({
  title = "Nova transferência",
  subtitle = "Transferência",
  backHref = "/estoque/transferencias",
  ...props
}: StockTransferFormHeaderProps) {
  return (
    <EntityFormHeader
      title={title}
      subtitle={subtitle}
      backHref={backHref}
      {...props}
    />
  );
}
