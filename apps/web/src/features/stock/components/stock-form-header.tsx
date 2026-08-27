"use client";

import {
  EntityFormHeader,
  type EntityFormHeaderProps,
} from "@/components/ui/form/entity-form-header";

type StockFormHeaderProps = Omit<EntityFormHeaderProps, "backHref"> & {
  backHref?: string;
};

export function StockFormHeader({
  title,
  subtitle = "Estoque",
  backHref = "/estoque",
}: StockFormHeaderProps) {
  return (
    <EntityFormHeader
      title={title}
      subtitle={subtitle}
      backHref={backHref}
    />
  );
}
