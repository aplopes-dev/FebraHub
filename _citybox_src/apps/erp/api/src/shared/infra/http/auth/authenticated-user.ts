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
 * Lê as claims de papel do token (ADR C-17, bloco 2).
 *
 * `clientId` é parâmetro, não literal: a versão anterior lia dois client ids
 * fixos em `resource_access`, o que só funcionava porque um client servia
 * quatro apps. Com um realm por sistema (ADR C-16) o client desta API vem do
 * env (`KEYCLOAK_CLIENT_ID`).
 *
 * Não há mais promoção de service account a operador de plataforma: a role
 * `platform.admin` é local ao realm `citybox-erp` e vem no `realm_access` do
 * token do `admin-m2m`.
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
    // Mesma role local do realm que o service account `admin-m2m` recebe.
    roles: ['platform.admin'],
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
