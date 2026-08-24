import { SetMetadata, type CustomDecorator } from '@nestjs/common';
import type { Actions, Subjects } from '@citybox/beautiful-permissions';

export const PERMISSION_KEY = 'citybox:casl-permission';
export const PERMISSION_ANY_KEY = 'citybox:casl-permission-any';

/**
 * Role local do realm `citybox-beautiful`, atribuída EXCLUSIVAMENTE ao service
 * account `admin-m2m` do admin-api (ADR C-16 §Papéis). Substituiu a realm role
 * global `platform_admin` e as variantes `platform_admin_client` /
 * `platform.admin`-como-permission, que cruzavam sistemas.
 */
export const PLATFORM_ADMIN_ROLE = 'platform.admin';

export type PermissionMetadata = {
  action: Actions;
  subject: Subjects;
};

/**
 * O que uma rota pode exigir:
 * - par CASL (`{ action, subject }`) — autorização do lojista, vinda de
 *   `StoreMember.permissions` pelo `StoreScopeGuard`;
 * - string — permissão de plataforma (hoje só `platform.admin`), resolvida
 *   direto das roles do JWT, sem passar pelo CASL.
 */
export type RequiredPermission = PermissionMetadata | string;

/** Usuário autenticado enriquecido pelo StoreScopeGuard (perms + owner). */
export type PermissionUser = {
  sub?: string;
  roles?: string[];
  permissions?: string[];
  isOrganizationOwner?: boolean;
};

/**
 * Bypass de operação da plataforma / M2M.
 *
 * Só `platform.admin`: com um realm por sistema, quem chega com essa role é o
 * service account `admin-m2m` do realm `citybox-beautiful` e mais ninguém.
 */
export function hasPlatformAdmin(user: PermissionUser): boolean {
  return (
    (user.roles ?? []).includes(PLATFORM_ADMIN_ROLE) ||
    (user.permissions ?? []).includes(PLATFORM_ADMIN_ROLE)
  );
}

export function RequirePermission(permission: string): CustomDecorator<string>;
export function RequirePermission(
  action: Actions,
  subject: Subjects,
): CustomDecorator<string>;
export function RequirePermission(
  actionOrPermission: Actions | string,
  subject?: Subjects,
): CustomDecorator<string> {
  if (subject === undefined) {
    return SetMetadata(PERMISSION_KEY, actionOrPermission);
  }
  return SetMetadata(PERMISSION_KEY, {
    action: actionOrPermission as Actions,
    subject,
  } satisfies PermissionMetadata);
}

/** Exige ao menos um dos pares action/subject. */
export const RequireAnyPermission = (...perms: PermissionMetadata[]) =>
  SetMetadata(PERMISSION_ANY_KEY, perms);
