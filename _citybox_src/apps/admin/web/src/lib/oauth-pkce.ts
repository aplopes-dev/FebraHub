const OAUTH_PENDING_KEY = 'citybox-admin-oauth-pending';
const TAB_ID_KEY = 'citybox-admin-tab-id';

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

function getTabId(): string {
  let id = sessionStorage.getItem(TAB_ID_KEY);
  if (!id) {
    id = randomUrlSafe(8);
    sessionStorage.setItem(TAB_ID_KEY, id);
  }
  return id;
}

function pendingKey(): string {
  return `${OAUTH_PENDING_KEY}-${getTabId()}`;
}

export function saveOAuthPending(pending: OAuthPending): void {
  sessionStorage.setItem(pendingKey(), JSON.stringify(pending));
}

export function peekOAuthPending(expectedState: string): OAuthPending | null {
  const raw = sessionStorage.getItem(pendingKey());
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
  sessionStorage.removeItem(pendingKey());
}

export async function beginOAuthAuthorization(redirectUri: string, force = false): Promise<string> {
  const issuer = process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER;
  if (!issuer) throw new Error('NEXT_PUBLIC_KEYCLOAK_ISSUER não configurado');

  // Sem default (ADR C-17, bloco 6). O default `'citybox-admin'` fazia um app mal
  // configurado pedir token silenciosamente para o client errado, em vez de falhar.
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
