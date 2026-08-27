"use client";

import { useQuery } from "@tanstack/react-query";
import { useOrganization } from "@/lib/organization-context";
import { getPermissionCatalog } from "@/features/users-permissions/api/permission-catalog.service";
import { permissionCatalogKeys } from "@/features/users-permissions/hooks/query-keys";

export function usePermissionCatalogQuery() {
  const { organizationId, hydrated } = useOrganization();

  return useQuery({
    queryKey: permissionCatalogKeys.all(organizationId),
    queryFn: () => getPermissionCatalog(),
    enabled: hydrated && Boolean(organizationId),
    staleTime: 30 * 60_000,
  });
}
