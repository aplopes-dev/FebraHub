"use client";

import { comercioFetch } from "@/lib/api/comercio-client";
import type { PermissionCatalogResponseDto } from "@/features/users-permissions/api/permission-profile.dto";
import { toPermissionGroups } from "@/features/users-permissions/api/permission-profile.mapper";
import type { PermissionCatalog } from "@/features/users-permissions/types/permission-profile";

export async function getPermissionCatalog(): Promise<PermissionCatalog> {
  const response = await comercioFetch<PermissionCatalogResponseDto>(
    "/v1/permission-catalog",
  );
  return {
    groups: toPermissionGroups(response.data.groups),
    allIds: [...response.data.allIds],
  };
}
