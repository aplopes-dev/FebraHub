import type { JWTPayload } from 'jose';

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
 * `clientId` é parâmetro, não literal (ADR C-17, bloco 2).
 *
 * A versão anterior lia `resource_access['citybox-backoffice']` e
 * `resource_access['citybox-admin']` hardcoded — o que só funcionava porque um
 * client servia quatro apps. Com um realm por sistema, o client é o do próprio
 * app (`KEYCLOAK_CLIENT_ID`).
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
    roles: ['platform_admin'],
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
