/**
 * Contrato HTTP de `/v1/permission-profiles` e `/v1/permission-catalog`.
 */

export type PermissionProfileDto = {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  systemKey: string | null;
  permissionIds: string[];
  /** Membros ativos vinculados a este perfil (somente listagem). */
  activeMemberCount?: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PermissionProfileListMetaDto = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type PermissionProfileListResponseDto = {
  data: PermissionProfileDto[];
  meta: PermissionProfileListMetaDto;
};

export type PermissionProfileResponseDto = {
  data: PermissionProfileDto;
};

export type SavePermissionProfilePayload = {
  name: string;
  description: string;
  permissionIds: string[];
};

export type PermissionCatalogItemDto = {
  id: string;
  label: string;
};

export type PermissionCatalogSubgroupDto = {
  id: string;
  label: string;
  items: PermissionCatalogItemDto[];
};

export type PermissionCatalogGroupDto = {
  id: string;
  label: string;
  scope: "backoffice";
  subgroups: PermissionCatalogSubgroupDto[];
};

export type PermissionCatalogResponseDto = {
  data: {
    groups: PermissionCatalogGroupDto[];
    allIds: string[];
  };
};
