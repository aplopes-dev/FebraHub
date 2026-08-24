"use client";

import {
  EntityFormHeader,
  type EntityFormHeaderProps,
} from "@/components/ui/form/entity-form-header";

export type CustomerFormHeaderProps = Omit<EntityFormHeaderProps, "backHref"> & {
  backHref?: string;
};

/** Header do formulário de cliente — defaults de rota/subtítulo. */
export function CustomerFormHeader({
  subtitle = "Clientes",
  backHref = "/clientes",
  ...props
}: CustomerFormHeaderProps) {
  return (
    <EntityFormHeader subtitle={subtitle} backHref={backHref} {...props} />
  );
}
