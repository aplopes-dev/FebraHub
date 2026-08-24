import type { PermissionProfile } from '../../domain/entities/permission-profile.entity';

export type CreatePermissionProfileDto = {
  organizationId: string;
  name: string;
  description?: string;
  permissionIds: string[];
};

export type UpdatePermissionProfileDto = {
  organizationId: string;
  id: string;
  name: string;
  description: string;
  permissionIds: string[];
};

export type DeletePermissionProfileDto = {
  organizationId: string;
  id: string;
};

export type RestorePermissionProfileDto = {
  organizationId: string;
  id: string;
};

export type FindPermissionProfileByIdDto = {
  organizationId: string;
  id: string;
};

export type ListPermissionProfilesDto = {
  organizationId: string;
  search?: string;
  /** Default: só ativos (`deletedAt = null`). */
  activeOnly?: boolean;
  page?: number;
  perPage?: number;
};

export type ListPermissionProfilesResult = {
  items: PermissionProfile[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};
