"use client";

import {
  EntityFormHeader,
  type EntityFormHeaderProps,
} from "@/components/ui/form/entity-form-header";

export type SupplierFormHeaderProps = Omit<EntityFormHeaderProps, "backHref"> & {
  backHref?: string;
};

export function SupplierFormHeader({
  subtitle = "Fornecedores",
  backHref = "/estoque/fornecedores",
  ...props
}: SupplierFormHeaderProps) {
  return (
    <EntityFormHeader subtitle={subtitle} backHref={backHref} {...props} />
  );
}
