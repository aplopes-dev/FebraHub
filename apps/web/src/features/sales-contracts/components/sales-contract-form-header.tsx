"use client";

import { EntityFormHeader } from "@/components/ui/form";

type SalesContractFormHeaderProps = {
  title?: string;
  subtitle?: string;
  backHref?: string;
};

export function SalesContractFormHeader({
  title = "Novo contrato",
  subtitle = "Contrato de venda",
  backHref = "/vendas/contratos-de-vendas",
}: SalesContractFormHeaderProps) {
  return (
    <EntityFormHeader
      title={title}
      subtitle={subtitle}
      backHref={backHref}
    />
  );
}
