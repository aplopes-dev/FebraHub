"use client";

import { useQuery } from "@tanstack/react-query";
import { useOrganization } from "@/lib/organization-context";
import {
  getBranchByIdApi,
  getMatrixByIdApi,
  getOrganizationStructureApi,
  listBranchesApi,
} from "@/features/branches/api/branches.service";
import { branchKeys } from "@/features/branches/hooks/query-keys";
import type { BranchListParams } from "@/features/branches/types/branch";

export function useBranchesQuery(params: BranchListParams) {
  const { organizationId, hydrated } = useOrganization();

  return useQuery({
    queryKey: branchKeys.list(organizationId, params),
    queryFn: () => listBranchesApi(params),
    enabled: hydrated && Boolean(organizationId),
  });
}

export function useOrganizationStructureQuery() {
  const { organizationId, hydrated } = useOrganization();

  return useQuery({
    queryKey: branchKeys.structure(organizationId),
    queryFn: () => getOrganizationStructureApi(),
    enabled: hydrated && Boolean(organizationId),
  });
}

export function useBranchQuery(id: string) {
  const { organizationId, hydrated } = useOrganization();

  return useQuery({
    queryKey: branchKeys.detail(organizationId, id),
    queryFn: () => getBranchByIdApi(id),
    enabled: hydrated && Boolean(organizationId) && Boolean(id),
    retry: false,
  });
}

export function useMatrixQuery(id: string) {
  const { organizationId, hydrated } = useOrganization();

  return useQuery({
    queryKey: branchKeys.matrix(organizationId, id),
    queryFn: () => getMatrixByIdApi(id),
    enabled: hydrated && Boolean(organizationId) && Boolean(id),
    retry: false,
  });
}

/** @deprecated Use useMatrixQuery */
export function useHeadquartersBranchQuery() {
  const { organizationId, hydrated } = useOrganization();

  return useQuery({
    queryKey: branchKeys.structure(organizationId),
    queryFn: async () => {
      const structure = await getOrganizationStructureApi();
      return structure.matrices[0] ?? null;
    },
    enabled: hydrated && Boolean(organizationId),
  });
}
