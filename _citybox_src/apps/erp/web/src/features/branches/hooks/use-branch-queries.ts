"use client";

import { useQuery } from "@tanstack/react-query";
import { useOrganization } from "@/lib/organization-context";
import {
  getBranchByIdApi,
  listBranchesApi,
} from "@/features/branches/api/branches.service";
import { branchKeys } from "@/features/branches/hooks/query-keys";
import type { BranchListParams } from "@/features/branches/types/branch";

export function useBranchesQuery(params: BranchListParams) {
  const { organizationId, hydrated } = useOrganization();

  return useQuery({
    queryKey: branchKeys.list(organizationId, params),
    queryFn: () => listBranchesApi(params),
    // Sem organização ativa a API responde 400 — não adianta disparar antes.
    enabled: hydrated && Boolean(organizationId),
  });
}

export function useBranchQuery(id: string) {
  const { organizationId, hydrated } = useOrganization();

  return useQuery({
    queryKey: branchKeys.detail(organizationId, id),
    queryFn: () => getBranchByIdApi(id),
    enabled: hydrated && Boolean(organizationId) && Boolean(id),
    retry: false, // 404 é resposta legítima ("unidade não encontrada")
  });
}
