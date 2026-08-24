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
 * Leitura de claims (ADR C-17, bloco 2).
 *
 * `clientId` é parâmetro, não literal. As seis cópias anteriores liam
 * `resource_access['citybox-backoffice']` hardcoded — o que só funcionava
 * porque um client servia quatro apps.
 *
 * Não há mais promoção de role por `azp`: a antiga versão adicionava
 * `platform_admin` quando o `azp` batia com o client admin global. Com um realm
 * por sistema (ADR C-16), `platform.admin` é **realm role local** de
 * `citybox-imoveis`, atribuída só ao service account `admin-m2m` — vem no
 * próprio `realm_access` do token e não precisa de inferência.
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
  const clientRoles = opts.clientId
    ? (resourceAccess?.[opts.clientId]?.roles ?? [])
    : [];

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
