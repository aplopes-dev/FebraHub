import type { MemberListParams } from "@/features/users-permissions/types/user";
import type { PermissionProfileListParams } from "@/features/users-permissions/types/permission-profile";

/**
 * Chaves de cache — escopo por `organizationId` (tenancy, não unidade ativa).
 * Trocar de empresa isola o cache automaticamente.
 */
export const memberKeys = {
  all: (organizationId: string) =>
    ["api", "members", organizationId] as const,
  lists: (organizationId: string) =>
    [...memberKeys.all(organizationId), "list"] as const,
  list: (organizationId: string, params: MemberListParams) =>
    [...memberKeys.lists(organizationId), params] as const,
  detail: (organizationId: string, id: string) =>
    [...memberKeys.all(organizationId), "detail", id] as const,
};

export const permissionProfileKeys = {
  all: (organizationId: string) =>
    ["api", "permission-profiles", organizationId] as const,
  lists: (organizationId: string) =>
    [...permissionProfileKeys.all(organizationId), "list"] as const,
  list: (organizationId: string, params: PermissionProfileListParams) =>
    [...permissionProfileKeys.lists(organizationId), params] as const,
  detail: (organizationId: string, id: string) =>
    [...permissionProfileKeys.all(organizationId), "detail", id] as const,
  options: (organizationId: string) =>
    [...permissionProfileKeys.all(organizationId), "options"] as const,
};

export const permissionCatalogKeys = {
  all: (organizationId: string) =>
    ["api", "permission-catalog", organizationId] as const,
};
