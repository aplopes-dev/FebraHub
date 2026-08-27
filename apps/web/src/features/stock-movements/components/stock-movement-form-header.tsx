"use client";

import { EntityFormHeader } from "@/components/ui/form";

type StockMovementFormHeaderProps = {
  title?: string;
  subtitle?: string;
  backHref?: string;
};

export function StockMovementFormHeader({
  title = "Registrar movimentação",
  subtitle = "Movimentação",
  backHref = "/estoque/movimentacoes",
}: StockMovementFormHeaderProps) {
  return (
    <EntityFormHeader
      title={title}
      subtitle={subtitle}
      backHref={backHref}
    />
  );
}
