/**
 * Origem pública do app (links absolutos: WhatsApp, Open Graph, sitemap).
 *
 * `getPublicAppOrigin` é **determinístico** no SSR e no 1º paint do client
 * (sem ler `window`) — evita hydration mismatch em âncoras e meta.
 *
 * Prioridade:
 * 1. `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_SITE_URL` / `IMOVEIS_WEB_URL`
 * 2. Fallback de dev: `http://localhost:3111`
 *
 * Para share/click no browser com env em loopback, use {@link getClientAppOrigin}.
 */
export function getPublicAppOrigin(): string {
  const fromEnv = (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.IMOVEIS_WEB_URL ??
    ''
  )
    .trim()
    .replace(/\/$/, '');

  if (fromEnv) return fromEnv;
  return 'http://localhost:3111';
}

/**
 * Origem efetiva no **browser** (handlers de share/click, pós-mount).
 * Preferência: URL pública real (env não-loopback) → origin da aba → env/fallback.
 */
export function getClientAppOrigin(): string {
  const configured = getPublicAppOrigin();
  if (typeof window === 'undefined') return configured;
  if (configured && !isLoopbackOrigin(configured)) return configured;
  const browser = window.location?.origin?.replace(/\/$/, '');
  return browser || configured;
}

function isLoopbackOrigin(origin: string): boolean {
  try {
    const host = new URL(origin).hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '::1';
  } catch {
    return false;
  }
}

/** Monta URL absoluta a partir de path (`/p/…`) ou devolve URLs já absolutas. */
export function toAbsoluteAppUrl(pathOrUrl: string): string {
  const trimmed = pathOrUrl.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${getPublicAppOrigin()}${path}`;
}
