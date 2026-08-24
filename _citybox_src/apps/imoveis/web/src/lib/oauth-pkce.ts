const OAUTH_PENDING_KEY = 'citybox-imoveis-oauth-pending';

export type OAuthPending = {
  state: string;
  codeVerifier: string;
  redirectUri: string;
};

function base64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function randomUrlSafe(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return base64Url(bytes);
}

export async function createCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64Url(new Uint8Array(digest));
}

export function saveOAuthPending(pending: OAuthPending): void {
  sessionStorage.setItem(OAUTH_PENDING_KEY, JSON.stringify(pending));
}

export function peekOAuthPending(expectedState: string): OAuthPending | null {
  const raw = sessionStorage.getItem(OAUTH_PENDING_KEY);
  if (!raw) return null;
  try {
    const pending = JSON.parse(raw) as OAuthPending;
    if (pending.state !== expectedState) return null;
    return pending;
  } catch {
    return null;
  }
}

export function clearOAuthPending(): void {
  sessionStorage.removeItem(OAUTH_PENDING_KEY);
}

/**
 * Monta a URL de autorização OAuth (ADR C-17, bloco 6).
 *
 * **Sem default de issuer nem de `client_id`.** A versão anterior caía em
 * `citybox-backoffice` / realm `citybox-dev`: um app mal configurado pedia token
 * silenciosamente para o client errado, em vez de falhar.
 *
 * Sobre o defeito D2: com realms separados, abrir o Imóveis logado no admin já
 * pede login — são sessões distintas. `force` (`prompt=login`) continua útil
 * para forçar reautenticação **dentro** do mesmo sistema (troca de conta).
 */
export async function beginOAuthAuthorization(redirectUri: string, force = false): Promise<string> {
  const issuer = process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER;
  if (!issuer) throw new Error('NEXT_PUBLIC_KEYCLOAK_ISSUER não configurado');

  const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT;
  if (!clientId) throw new Error('NEXT_PUBLIC_KEYCLOAK_CLIENT não configurado');

  const state = randomUrlSafe(32);
  const codeVerifier = randomUrlSafe(48);
  const codeChallenge = await createCodeChallenge(codeVerifier);
  saveOAuthPending({ state, codeVerifier, redirectUri });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile email',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });
  if (force) params.set('prompt', 'login');

  return `${issuer}/protocol/openid-connect/auth?${params}`;
}
