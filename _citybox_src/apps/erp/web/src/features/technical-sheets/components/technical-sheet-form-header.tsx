"use client";

import { EntityFormHeader } from "@/components/ui/form";

type TechnicalSheetFormHeaderProps = {
  productName: string;
  backHref?: string;
  backLabel?: string;
};

export function TechnicalSheetFormHeader({
  productName,
  backHref = "/catalogo/fichas-tecnicas",
  backLabel = "",
}: TechnicalSheetFormHeaderProps) {
  return (
    <EntityFormHeader
      title={productName}
      subtitle="Ficha técnica"
      backHref={backHref}
      backLabel={backLabel}
    />
  );
}
