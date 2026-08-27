"use client";

import { EntityFormHeader } from "@/components/ui/form";

type FiscalParametersFormHeaderProps = {
  productName: string;
  backHref?: string;
};

export function FiscalParametersFormHeader({
  productName,
  backHref = "/catalogo/parametros-fiscais",
}: FiscalParametersFormHeaderProps) {
  return (
    <EntityFormHeader
      title={productName}
      subtitle="Parâmetros fiscais"
      backHref={backHref}
    />
  );
}
