"use client";

import {
  EntityFormHeader,
  type EntityFormHeaderProps,
} from "@/components/ui/form/entity-form-header";

export type ProductFormHeaderProps = Omit<EntityFormHeaderProps, "backHref"> & {
  backHref?: string;
};

/** Header do formulário de produto — defaults de rota/subtítulo. */
export function ProductFormHeader({
  subtitle = "Produto",
  backHref = "/catalogo/produtos",
  ...props
}: ProductFormHeaderProps) {
  return (
    <EntityFormHeader subtitle={subtitle} backHref={backHref} {...props} />
  );
}
