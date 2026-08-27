"use client";

import { useQuery } from "@tanstack/react-query";
import { useOrganization } from "@/lib/organization-context";
import {
  getPermissionProfileById,
  listActivePermissionProfileOptions,
  listPermissionProfiles,
} from "@/features/users-permissions/api/permission-profiles.service";
import { permissionProfileKeys } from "@/features/users-permissions/hooks/query-keys";
import type { PermissionProfileListParams } from "@/features/users-permissions/types/permission-profile";

export function usePermissionProfilesQuery(params: PermissionProfileListParams) {
  const { organizationId, hydrated } = useOrganization();

  return useQuery({
    queryKey: permissionProfileKeys.list(organizationId, params),
    queryFn: () => listPermissionProfiles(params),
    enabled: hydrated && Boolean(organizationId),
  });
}

export function usePermissionProfileQuery(id: string) {
  const { organizationId, hydrated } = useOrganization();

  return useQuery({
    queryKey: permissionProfileKeys.detail(organizationId, id),
    queryFn: () => getPermissionProfileById(id),
    enabled: hydrated && Boolean(organizationId) && Boolean(id),
    retry: false,
  });
}

export function useActivePermissionProfileOptionsQuery() {
  const { organizationId, hydrated } = useOrganization();

  return useQuery({
    queryKey: permissionProfileKeys.options(organizationId),
    queryFn: () => listActivePermissionProfileOptions(),
    enabled: hydrated && Boolean(organizationId),
    staleTime: 5 * 60_000,
  });
}
