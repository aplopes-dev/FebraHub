import {
  fetchUsers,
  createPlatformUser,
  updatePlatformUser,
  deletePlatformUser,
  resendPlatformUserInvite,
  type PlatformUserDto,
} from '@/lib/admin-api';
import type {
  PlatformUser,
  PlatformRole,
  CreateUserPayload,
  UpdateUserPayload,
} from '../types';

export const DEFAULT_USERS_LIST_PARAMS = { perPage: 100 } as const;

export type UsersListParams = {
  page?: number;
  perPage?: number;
  search?: string;
  roles?: PlatformRole[];
};

export type UsersListResult = {
  data: PlatformUser[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
};

function mapUserDto(dto: PlatformUserDto): PlatformUser {
  return {
    id: dto.id,
    keycloakSub: dto.keycloakSub,
    email: dto.email,
    displayName: dto.displayName,
    role: dto.role,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export async function listUsers(
  params: UsersListParams = DEFAULT_USERS_LIST_PARAMS,
): Promise<UsersListResult> {
  const result = await fetchUsers(params);
  return {
    data: result.data.map(mapUserDto),
    meta: result.meta,
  };
}

export async function createUser(
  payload: CreateUserPayload,
): Promise<PlatformUser> {
  const result = await createPlatformUser(payload);
  return mapUserDto(result.data);
}

export async function updateUser(
  id: string,
  payload: UpdateUserPayload,
): Promise<PlatformUser> {
  const result = await updatePlatformUser(id, payload);
  return mapUserDto(result.data);
}

export async function deleteUser(id: string): Promise<void> {
  await deletePlatformUser(id);
}

export async function resendUserInvite(id: string): Promise<void> {
  await resendPlatformUserInvite(id);
}
