import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'citybox:permission';

export type PermissionUser = { roles: string[]; permissions?: string[] };

/**
 * Roles do realm `citybox-admin` (ADR C-16) — a equipe interna Citybox.
 *
 * Saíram daqui: `store_staff`, `platform_admin_client` e as
 * `vertical.<slug>.view`. Elas pertenciam ao realm compartilhado `citybox-dev`
 * e ao client `citybox-backoffice`, que não existem mais; o acesso do lojista
 * hoje é decidido pelo realm da própria vertical. `store.catalog.manage` e
 * `store.scheduling.manage` foram junto: só eram concedidas a `store_staff`.
 *
 * `platform_operator` segue **sem** entrada aqui, como antes: ele passa no gate
 * de login do admin-web (`hasPlatformAdminAccess`) mas não recebe
 * `platform.admin`. Mudar isso é decisão de produto, não desta refatoração.
 */
const ROLE_PERMISSIONS: Record<string, string[]> = {
  platform_admin: ['platform.admin'],
};

export function resolvePermissions(user: PermissionUser): string[] {
  const perms = new Set<string>(user.permissions ?? []);
  for (const role of user.roles) {
    for (const p of ROLE_PERMISSIONS[role] ?? []) perms.add(p);
    if (role in ROLE_PERMISSIONS === false && role.includes('.'))
      perms.add(role);
  }
  return [...perms];
}

export const RequirePermission = (permission: string) =>
  SetMetadata(PERMISSION_KEY, permission);
