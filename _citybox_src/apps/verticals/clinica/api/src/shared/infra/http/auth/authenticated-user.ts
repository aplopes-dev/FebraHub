import type { JWTPayload } from 'jose';

export type AuthenticatedUser = {
  sub: string;
  roles: string[];
  /** Nome de exibição (claim `name` / given+family do Keycloak). */
  name?: string;
  username?: string;
  email?: string;
};

function readTokenString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readDisplayName(payload: JWTPayload): string | undefined {
  const fullName = readTokenString(payload.name);
  if (fullName) return fullName;

  const given = readTokenString(payload.given_name);
  const family = readTokenString(payload.family_name);
  if (given && family) return `${given} ${family}`;
  if (given) return given;
  if (family) return family;
  return undefined;
}

/**
 * Lê as roles do JWT — ADR C-17, bloco 2.
 *
 * `clientId` é **parâmetro**, não literal: a versão anterior lia
 * `resource_access['citybox-backoffice']` e `['citybox-admin']` hardcoded, o que só
 * funcionava porque um client servia quatro apps. Com o realm `citybox-clinica` o
 * client é o do próprio app (`KEYCLOAK_CLIENT_ID`).
 *
 * Não há mais promoção de `azp` a `platform_admin`: a role `platform.admin` é local
 * do realm e vem em `realm_access` do service account `admin-m2m` (ADR C-16 §Papéis).
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
    name: readDisplayName(payload),
    username:
      readTokenString(payload.preferred_username) ??
      readTokenString(payload.username),
    email: readTokenString(payload.email),
  };
}

export function devBypassAuthenticatedUser(): AuthenticatedUser {
  return {
    sub: 'dev-admin',
    roles: ['platform.admin'],
    name: process.env.AUTH_DEV_NAME?.trim() || 'Administrador',
    username: process.env.AUTH_DEV_USERNAME?.trim() || 'admin',
    email: process.env.AUTH_DEV_EMAIL?.trim() || 'admin@citybox.local',
  };
}

/** Nome legível para auditoria / "autorizado por" — prioriza nome completo. */
export function resolveAuthenticatedUserDisplayName(
  user: Pick<AuthenticatedUser, 'name' | 'username' | 'email' | 'sub'>,
): string {
  return (
    user.name?.trim() ||
    user.username?.trim() ||
    user.email?.trim() ||
    user.sub
  );
}

export function formatAuditActor(
  user: Pick<AuthenticatedUser, 'name' | 'username' | 'email' | 'sub'>,
): string {
  const displayName = resolveAuthenticatedUserDisplayName(user);
  const email = user.email?.trim();

  if (user.name?.trim() && email) return `${user.name.trim()} · ${email}`;
  if (displayName && email && displayName !== email) {
    return `${displayName} · ${email}`;
  }
  return displayName;
}
