'use client';

import { type Session } from './auth';
import { resolveBackofficePermissions } from './vertical-permissions';

let cached: { permissions: string[]; at: number } | null = null;

export function invalidatePermissionsCache() {
  cached = null;
}

/**
 * Resolve permissões do backoffice a partir da sessão (JWT / Keycloak).
 * Não depende do marketplace-api (core).
 */
export async function fetchPlatformPermissions(session: Session | null): Promise<string[]> {
  if (!session?.user?.name) {
    return [];
  }

  if (typeof window !== 'undefined' && cached && cached.at > Date.now() - 60_000) {
    return cached.permissions;
  }

  const permissions = resolveBackofficePermissions(session.permissions ?? []);
  if (typeof window !== 'undefined') {
    cached = { permissions, at: Date.now() };
  }
  return permissions;
}


export function hasPermissionSync(permissions: string[], permission?: string) {
  if (!permission) return true;
  return permissions.includes(permission);
}
