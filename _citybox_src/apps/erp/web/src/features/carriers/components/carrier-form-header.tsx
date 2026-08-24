"use client";

import {
  EntityFormHeader,
  type EntityFormHeaderProps,
} from "@/components/ui/form/entity-form-header";

export type CarrierFormHeaderProps = Omit<EntityFormHeaderProps, "backHref"> & {
  backHref?: string;
};

export function CarrierFormHeader({
  subtitle = "Transportadoras",
  backHref = "/estoque/transportadoras",
  ...props
}: CarrierFormHeaderProps) {
  return (
    <EntityFormHeader subtitle={subtitle} backHref={backHref} {...props} />
  );
}
