import { SetMetadata } from '@nestjs/common';
import type { Actions, Subjects } from '@citybox/imoveis-permissions';

export const PERMISSION_KEY = 'citybox:casl-permission';
export const PERMISSION_ANY_KEY = 'citybox:casl-permission-any';
export const PLATFORM_ADMIN_KEY = 'citybox:platform-admin';

export type PermissionMetadata = {
  action: Actions;
  subject: Subjects;
};

/** Usuário autenticado enriquecido pelo ImoveisScopeGuard. */
export type PermissionUser = {
  sub?: string;
  email?: string;
  roles: string[];
  permissions?: string[];
  isOrganizationOwner?: boolean;
};

/**
 * `platform.admin` é **realm role local** de `citybox-imoveis` (ADR C-16),
 * atribuída exclusivamente ao service account `admin-m2m` do admin-api.
 *
 * As variantes globais `platform_admin` / `platform_admin_client` do realm
 * compartilhado deixaram de existir — aceitá-las agora seria aceitar uma role
 * que nenhum token deste realm carrega, e mascararia um token de outro sistema.
 */
export function isPlatformAdmin(user: PermissionUser): boolean {
  if (user.roles.includes('platform.admin')) return true;
  if ((user.permissions ?? []).includes('platform.admin')) return true;
  return false;
}

export const RequirePermission = (action: Actions, subject: Subjects) =>
  SetMetadata(PERMISSION_KEY, { action, subject } satisfies PermissionMetadata);

export const RequireAnyPermission = (...perms: PermissionMetadata[]) =>
  SetMetadata(PERMISSION_ANY_KEY, perms);

export const RequirePlatformAdmin = () => SetMetadata(PLATFORM_ADMIN_KEY, true);
