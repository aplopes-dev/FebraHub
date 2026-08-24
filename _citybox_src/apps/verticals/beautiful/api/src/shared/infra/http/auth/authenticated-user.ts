import type { JWTPayload } from 'jose';
import { PLATFORM_ADMIN_ROLE } from '../decorators/permissions';

export type AuthenticatedUser = {
  sub: string;
  roles: string[];
  username?: string;
  email?: string;
};

function readTokenString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * `clientId` é parâmetro, não literal.
 *
 * A versão anterior lia `resource_access['citybox-backoffice']` e
 * `resource_access['citybox-admin']` hardcoded, e ainda promovia a role
 * `platform_admin` quando o `azp` batia com `KEYCLOAK_ADMIN_CLIENT_ID` — tudo
 * isso só existia porque um client servia quatro apps no realm compartilhado.
 * Com o realm `citybox-beautiful`, o `admin-m2m` chega com a realm role
 * `platform.admin` de verdade e nenhuma promoção é necessária (ADR C-16).
 */
export function authenticatedUserFromJwtPayload(
  payload: JWTPayload,
  opts: { clientId: string },
): AuthenticatedUser {
  const realmRoles =
    (payload.realm_access as { roles?: string[] } | undefined)?.roles ?? [];
  const resourceAccess = payload.resource_access as
    | Record<string, { roles?: string[] }>
    | undefined;
  const clientRoles = resourceAccess?.[opts.clientId]?.roles ?? [];

  return {
    sub: payload.sub ?? 'unknown',
    roles: [...new Set([...realmRoles, ...clientRoles])],
    username:
      readTokenString(payload.preferred_username) ??
      readTokenString(payload.username),
    email: readTokenString(payload.email),
  };
}

export function devBypassAuthenticatedUser(): AuthenticatedUser {
  return {
    sub: 'dev-admin',
    roles: [PLATFORM_ADMIN_ROLE],
    username: process.env.AUTH_DEV_USERNAME?.trim() || 'admin',
    email: process.env.AUTH_DEV_EMAIL?.trim() || 'admin@citybox.local',
  };
}

export function formatAuditActor(
  user: Pick<AuthenticatedUser, 'username' | 'email' | 'sub'>,
): string {
  const username = user.username?.trim();
  const email = user.email?.trim();

  if (username && email) return `${username} · ${email}`;
  if (username) return username;
  if (email) return email;
  return user.sub;
}
