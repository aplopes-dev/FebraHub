import type { JWTPayload } from 'jose';

export type AuthenticatedUser = {
  sub: string;
  roles: string[];
  username?: string;
  email?: string;
  /**
   * `azp` do token — qual client o emitiu.
   *
   * Na `fiscal-api` isto não é informativo: é o que identifica **qual sistema**
   * está chamando, e é a base da `CompanyAccessPolicy` desde que o acesso
   * passou a ser M2M (ADR C-16). Duplicado em `azp` abaixo só porque
   * `applyActingSub` (BUG-01) precisa comparar contra o client de serviço
   * específico da fiscal-api — os dois campos sempre recebem o mesmo valor.
   */
  clientId?: string;
  /** Mesmo valor de `clientId` — ver nota acima. */
  azp?: string;
};

function readTokenString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readClientRoles(payload: JWTPayload, clientId: string): string[] {
  const resourceAccess = payload.resource_access as
    | Record<string, { roles?: string[] }>
    | undefined;
  return resourceAccess?.[clientId]?.roles ?? [];
}

/**
 * `clientId` é parâmetro, não lista fixa.
 *
 * Antes havia um array de clients internos (`citybox-backoffice`, `citybox-admin`,
 * `citybox-erp`) e as roles de todos eram lidas de qualquer token — o que só não
 * causava confusão porque um client servia vários apps. Com um realm por sistema
 * (ADR C-16) o client que emitiu o token é o `azp`, e é dele que as roles saem.
 */
export function authenticatedUserFromJwtPayload(
  payload: JWTPayload,
  opts: { clientId: string },
): AuthenticatedUser {
  const realmRoles =
    (payload.realm_access as { roles?: string[] } | undefined)?.roles ?? [];
  const clientRoles = readClientRoles(payload, opts.clientId);

  return {
    sub: payload.sub ?? 'unknown',
    roles: [...new Set([...realmRoles, ...clientRoles])],
    username:
      readTokenString(payload.preferred_username) ??
      readTokenString(payload.username),
    email: readTokenString(payload.email),
    azp: readTokenString(payload.azp) ?? readTokenString(payload.client_id),
    clientId: opts.clientId,
  };
}

/// Único client autorizado a ter o `sub` do token substituído pelo header
/// `X-Acting-Sub` (BUG-01, 2026-08-13) — o proxy erp-web autentica com este
/// client de serviço em rotas com dono verificado, mas a
/// `StoreMembershipCompanyAccessPolicy` da fiscal-api precisa do `sub` de
/// quem *de fato* chamou para resolver a participação na loja.
const SERVICE_CLIENT_ID = 'citybox-fiscal-service';

/// Aplica `X-Acting-Sub` ao usuário autenticado, só quando o token é do
/// client de serviço — nunca para um token de usuário comum (que poderia
/// tentar se passar por outra pessoa mandando o header por conta própria).
///
/// **Fail-closed**: token de serviço sem o header (ou header vazio) vira
/// `sub: 'unknown'` — a `CompanyAccessPolicy` já nega isso (mesmo tratamento
/// de "sem sub utilizável" que já existia). Nunca libera por omissão.
export function applyActingSub(
  user: AuthenticatedUser,
  actingSubHeader: string | undefined,
): AuthenticatedUser {
  if (user.azp !== SERVICE_CLIENT_ID) return user;
  const actingSub = actingSubHeader?.trim();
  return {
    ...user,
    sub: actingSub && actingSub.length > 0 ? actingSub : 'unknown',
  };
}

export function devBypassAuthenticatedUser(): AuthenticatedUser {
  return {
    sub: 'dev-admin',
    // `platform.admin` (pontuada), não a antiga `platform_admin` do realm
    // compartilhado — é o que `ROLE_PERMISSIONS` reconhece desde o ADR C-16.
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
