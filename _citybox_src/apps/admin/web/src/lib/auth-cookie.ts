export const ACCESS_COOKIE = 'citybox_admin_access';
export const REFRESH_COOKIE = 'citybox_admin_refresh';
export const ID_COOKIE = 'citybox_admin_id';

const DEFAULT_MAX_AGE = 60 * 60 * 24 * 30;

export function authCookieOptions(maxAgeSeconds = DEFAULT_MAX_AGE) {
  const secure = process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true';
  return {
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
