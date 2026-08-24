import type { AuthUser } from './auth.types.js';

/**
 * Leitura de claims (ADR C-17, bloco 2).
 *
 * `clientId` é parâmetro, não literal. A versão anterior lia
 * `resource_access['citybox-admin']` e `resource_access['citybox-backoffice']`
 * hardcoded — o que só fazia sentido quando um client servia vários apps. Com
 * um realm por sistema (ADR C-16) o client é o do próprio app
 * (`KEYCLOAK_CLIENT_ID=marketplace-app`).
 */
export function mapKeycloakPayload(
  payload: Record<string, unknown>,
  opts: { clientId: string },
): AuthUser {
  const realmRoles =
    (payload.realm_access as { roles?: string[] } | undefined)?.roles ?? [];
  const resourceAccess = payload.resource_access as
    | Record<string, { roles?: string[] }>
    | undefined;
  const clientRoles = opts.clientId ? (resourceAccess?.[opts.clientId]?.roles ?? []) : [];

  const name =
    (payload.name as string) ||
    [payload.given_name, payload.family_name].filter(Boolean).join(' ') ||
    (payload.preferred_username as string) ||
    undefined;
  const email = typeof payload.email === 'string' ? payload.email : undefined;

  return {
    sub: String(payload.sub),
    roles: [...new Set([...realmRoles, ...clientRoles])],
    storeId: (payload.storeId as string) ?? (payload['store_id'] as string),
    kind: 'user',
    name,
    email,
  };
}
