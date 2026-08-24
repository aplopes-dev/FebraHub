import { SetMetadata } from '@nestjs/common';
import type { Actions, Subjects } from '@citybox/clinica-permissions';

export const PERMISSION_KEY = 'citybox:casl-permission';
export const PERMISSION_ANY_KEY = 'citybox:casl-permission-any';
export const PLATFORM_ADMIN_KEY = 'citybox:platform-admin';

export type PermissionMetadata = {
  action: Actions;
  subject: Subjects;
};

/** Usuário autenticado enriquecido pelo ClinicScopeGuard (perms + owner). */
export type PermissionUser = {
  sub?: string;
  roles: string[];
  permissions?: string[];
  isOrganizationOwner?: boolean;
};

/**
 * Bypass de operação da plataforma / M2M.
 *
 * `platform.admin` é **role local do realm `citybox-clinica`** (ADR C-16 §Papéis),
 * atribuída exclusivamente ao service account `admin-m2m` que o `admin-api` usa para
 * falar com esta API. As variantes globais anteriores (`platform_admin`,
 * `platform_admin_client`) eram chaves cruzadas entre sistemas e não existem mais.
 */
export function isPlatformAdmin(user: PermissionUser): boolean {
  if (user.roles.includes('platform.admin')) return true;
  if ((user.permissions ?? []).includes('platform.admin')) return true;
  return false;
}

export const RequirePermission = (action: Actions, subject: Subjects) =>
  SetMetadata(PERMISSION_KEY, { action, subject } satisfies PermissionMetadata);

/** Exige ao menos um dos pares action/subject. */
export const RequireAnyPermission = (...perms: PermissionMetadata[]) =>
  SetMetadata(PERMISSION_ANY_KEY, perms);

/** Só operação da plataforma (ex.: retry store-setup). */
export const RequirePlatformAdmin = () => SetMetadata(PLATFORM_ADMIN_KEY, true);
