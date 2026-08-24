"use client";

import { useMemo } from "react";
import { useOrganization } from "@/lib/organization-context";
import type { ProductUnit } from "@/features/products/data/mock-units";

/**
 * As unidades da empresa ativa no formato que o `ProductUnitsDrawer` espera.
 *
 * Lê do `OrganizationProvider` em vez de buscar de novo — as filiais já foram
 * carregadas para o seletor do header.
 */
export function useBranchUnits(): ProductUnit[] {
  const { branches } = useOrganization();

  return useMemo(
    () =>
      branches.map((branch) => ({
        id: branch.id,
        name: `${branch.code} · ${branch.displayName}`,
        city: branch.city ?? "",
        uf: branch.state ?? "",
      })),
    [branches],
  );
}
