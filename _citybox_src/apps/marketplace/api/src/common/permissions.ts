import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'citybox:permission';

export type PermissionUser = { roles: string[]; permissions?: string[] };

/**
 * Não há mais mapa "realm role global → permissões".
 *
 * Com um realm por sistema (ADR C-16) as roles globais `platform_admin`,
 * `platform_admin_client`, `store_staff` e as client roles `vertical.*.view`
 * deixaram de existir — estar no realm já é o gate de acesso. O realm
 * `citybox-marketplace` declara uma única role de população, `consumer`, que
 * não concede nenhuma permissão de backoffice.
 *
 * Permissão continua vindo de duas fontes, ambas já pontuadas:
 *  - roles do token com ponto no nome (`platform.admin`, `store.catalog.manage`),
 *    que são a forma canônica de role local de realm (ver ADR C-16, §Papéis);
 *  - `user.permissions`, quando a origem é o banco e não o token.
 */
export function resolvePermissions(user: PermissionUser): string[] {
  const perms = new Set<string>(user.permissions ?? []);
  for (const role of user.roles) {
    if (role.includes('.')) perms.add(role);
  }
  return [...perms];
}

export const RequirePermission = (permission: string) => SetMetadata(PERMISSION_KEY, permission);
