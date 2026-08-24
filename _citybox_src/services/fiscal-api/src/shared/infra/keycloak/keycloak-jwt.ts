import {
  createRemoteJWKSet,
  decodeJwt,
  jwtVerify,
  type JWTVerifyResult,
} from 'jose';

/**
 * Verificação de token da `fiscal-api` — o **único** serviço multi-issuer do
 * ecossistema (ADR C-16 §Invariantes, exceção documentada).
 *
 * ## Por que aqui é diferente
 *
 * Todo app tem realm próprio e aceita um issuer só. A `fiscal-api` não tem
 * realm: ela não hospeda usuário nenhum, não tem tela de login e não emite
 * credencial — é um microserviço consumido pelos sistemas do Citybox. Criar um
 * realm para ela produziria um realm vazio.
 *
 * O que ela precisa é decidir **de quem aceita token**, e isso é uma allowlist
 * fechada vinda do env. Nunca um fallback silencioso: aceitar um issuer não
 * declarado é aceitar tokens de um realm que ninguém autorizou.
 *
 * ## Um JWKS por issuer
 *
 * A versão anterior iterava vários issuers contra **um único** `jwks` — o que
 * só funcionava porque eram hosts diferentes do *mesmo* realm (`citybox-dev`),
 * e portanto a mesma chave de assinatura. Com um realm por sistema cada issuer
 * tem chave própria, então o JWKS passa a ser resolvido por issuer e cacheado
 * individualmente.
 */

const jwksByIssuer = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

/**
 * Issuers aceitos, em lista fechada.
 *
 * Hoje: só `citybox-erp` — o ERP é o único consumidor real da `fiscal-api`
 * (`apps/erp/web/src/app/api/proxy/fiscal`). Sistema novo **não** deve ser
 * adicionado aqui por reflexo: ver a nota de autorização em `AGENTS.md` §5.
 */
export function allowedIssuers(): string[] {
  const raw = process.env.KEYCLOAK_ALLOWED_ISSUERS?.trim();
  if (!raw) throw new Error('KEYCLOAK_ALLOWED_ISSUERS não configurado');
  const issuers = raw
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
  if (issuers.length === 0) {
    throw new Error('KEYCLOAK_ALLOWED_ISSUERS está vazio');
  }
  return issuers;
}

/** Clients cujos tokens esta API aceita, em lista fechada. */
export function allowedAuthorizedParties(): string[] {
  const raw = process.env.KEYCLOAK_ALLOWED_AZP?.trim();
  if (!raw) throw new Error('KEYCLOAK_ALLOWED_AZP não configurado');
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function jwksFor(issuer: string): ReturnType<typeof createRemoteJWKSet> {
  const cached = jwksByIssuer.get(issuer);
  if (cached) return cached;
  const jwks = createRemoteJWKSet(
    new URL(`${issuer}/protocol/openid-connect/certs`),
  );
  jwksByIssuer.set(issuer, jwks);
  return jwks;
}

/**
 * Verifica o token contra o realm que o emitiu.
 *
 * Lê o `iss` **sem verificar** só para escolher o JWKS certo; a confiança vem
 * do `jwtVerify` seguinte, que valida assinatura e issuer. Um `iss` fora da
 * allowlist é recusado antes de qualquer requisição de rede — assim um token
 * forjado não faz a API buscar JWKS de um host arbitrário.
 */
export async function verifyKeycloakJwt(
  token: string,
): Promise<JWTVerifyResult> {
  let unverifiedIssuer: string;
  try {
    unverifiedIssuer = (decodeJwt(token).iss ?? '').replace(/\/$/, '');
  } catch {
    throw new Error('Token malformado');
  }

  const allowed = allowedIssuers();
  if (!unverifiedIssuer || !allowed.includes(unverifiedIssuer)) {
    throw new Error(
      `Issuer não autorizado: ${unverifiedIssuer || '(ausente)'}`,
    );
  }

  return jwtVerify(token, jwksFor(unverifiedIssuer), {
    issuer: unverifiedIssuer,
  });
}
