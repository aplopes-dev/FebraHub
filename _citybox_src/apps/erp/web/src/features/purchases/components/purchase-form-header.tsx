"use client";

import { EntityFormHeader } from "@/components/ui/form";

type PurchaseFormHeaderProps = {
  title?: string;
  subtitle?: string;
  backHref?: string;
};

export function PurchaseFormHeader({
  title = "Nova compra",
  subtitle = "Compra",
  backHref = "/estoque/compras",
}: PurchaseFormHeaderProps) {
  return (
    <EntityFormHeader
      title={title}
      subtitle={subtitle}
      backHref={backHref}
      backLabel="Voltar para compras"
    />
  );
}
