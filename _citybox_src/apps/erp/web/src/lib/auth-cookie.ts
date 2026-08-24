/**
 * Cookies da sessão do ERP Comércio.
 *
 * Nomes próprios (`_comercio_`) e não os do backoffice: os dois apps podem rodar
 * no mesmo host em dev, e cookies homônimos se sobrescreveriam.
 */
export const ACCESS_COOKIE = 'citybox_comercio_access';
export const REFRESH_COOKIE = 'citybox_comercio_refresh';
export const ID_COOKIE = 'citybox_comercio_id';

const DEFAULT_MAX_AGE = 60 * 60 * 24 * 30;

export function authCookieOptions(maxAgeSeconds = DEFAULT_MAX_AGE) {
  const secure =
    process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true';
  return {
    // httpOnly: o JavaScript da página nunca vê o token — um XSS não leva a sessão.
    httpOnly: true,
    secure,
    sameSite: 'strict' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

export function clearAuthCookieOptions() {
  return { ...authCookieOptions(0), maxAge: 0 };
}
