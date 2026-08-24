export const ACCESS_COOKIE = 'citybox_imoveis_access';
export const REFRESH_COOKIE = 'citybox_imoveis_refresh';
export const ID_COOKIE = 'citybox_imoveis_id';

const DEFAULT_MAX_AGE = 60 * 60 * 24 * 30;

/**
 * Cookies httpOnly — tokens nunca no JavaScript.
 *
 * `sameSite: 'lax'` (não `strict`): top-level GET cross-site (ex.: link aberto
 * a partir do app WhatsApp) ainda envia a sessão, permitindo o banner
 * “Criar Lead” em `/p/:id?action=new-lead` para corretor logado. Mutações
 * cross-site POST continuam bloqueadas pelo Lax.
 */
export function authCookieOptions(maxAgeSeconds = DEFAULT_MAX_AGE) {
  const secure =
    process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true';
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

export function clearAuthCookieOptions() {
  return { ...authCookieOptions(0), maxAge: 0 };
}
