"use client";

import { EntityFormHeader } from "@/components/ui/form";

type PriceListDetailHeaderProps = {
  priceListName: string;
  backHref?: string;
};

export function PriceListDetailHeader({
  priceListName,
  backHref = "/catalogo/lista-de-precos",
}: PriceListDetailHeaderProps) {
  return (
    <EntityFormHeader
      title={priceListName}
      subtitle="Lista de preços"
      backHref={backHref}
    />
  );
}
