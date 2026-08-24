import { jwtVerify, type JWTVerifyOptions, type JWTVerifyResult } from 'jose';

/**
 * Issuer ÚNICO, vindo do env (ADR C-17, bloco 1).
 *
 * A versão anterior mantinha uma lista de fallback (`auth.citybox.com`,
 * `auth.citybox.com:8080`, `127.0.0.1:8080`) e tentava uma a uma até alguma
 * passar. Com um realm por sistema (ADR C-16) isso é perigoso: aceitar mais de
 * um issuer é aceitar token de mais de um realm.
 */
export function keycloakIssuer(): string {
  const issuer = process.env.KEYCLOAK_ISSUER?.trim();
  if (!issuer) throw new Error('KEYCLOAK_ISSUER não configurado');
  return issuer;
}

export async function verifyKeycloakJwt(
  token: string,
  jwks: Parameters<typeof jwtVerify>[1],
  opts: Omit<JWTVerifyOptions, 'issuer'> = {},
): Promise<JWTVerifyResult> {
  return jwtVerify(token, jwks, { ...opts, issuer: keycloakIssuer() });
}

/**
 * Clients cujos tokens esta API aceita — invariante 1 do ADR C-16.
 *
 * Valida-se `azp`, não `aud`: por padrão o Keycloak emite `aud: account` e só
 * coloca o client em `aud` quando há um *audience mapper*. `azp` (authorized
 * party) carrega sempre o `client_id` que pediu o token.
 *
 * Vem do env, sem default: `KEYCLOAK_ALLOWED_AZP=marketplace-app`.
 */
export function allowedAuthorizedParties(): string[] {
  const raw = process.env.KEYCLOAK_ALLOWED_AZP?.trim();
  if (!raw) throw new Error('KEYCLOAK_ALLOWED_AZP não configurado');
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
