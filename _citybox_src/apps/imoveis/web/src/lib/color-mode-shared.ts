/**
 * Utils de color mode **sem** `'use client'` — seguros no RSC (`layout.tsx`).
 * Provider/hooks ficam em `color-mode.tsx`.
 */

/** Tema do painel autenticado. */
export const PANEL_COLOR_MODE_STORAGE_KEY = 'theme';

/** Tema das páginas públicas `/agents/*` (independente do painel). */
export const CATALOG_COLOR_MODE_STORAGE_KEY = 'imoveis.catalog.theme';

/**
 * Cookie SSR do painel — lido em `layout.tsx` para MUI + classe `.dark` no 1º paint.
 * Espelha `PANEL_COLOR_MODE_STORAGE_KEY`.
 */
export const PANEL_COLOR_MODE_COOKIE_NAME = 'imoveis.theme';

/** Cookie SSR do catálogo público. */
export const CATALOG_COLOR_MODE_COOKIE_NAME = 'imoveis.catalog.theme.cookie';

export const COLOR_MODE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 ano

export type ColorMode = 'light' | 'dark';

export function isColorMode(
  value: string | null | undefined,
): value is ColorMode {
  return value === 'dark' || value === 'light';
}

export function parseColorMode(
  value: string | null | undefined,
  fallback: ColorMode = 'light',
): ColorMode {
  return isColorMode(value) ? value : fallback;
}

export function isCatalogPathname(
  pathname: string | null | undefined,
): boolean {
  if (!pathname) return false;
  return pathname.startsWith('/agents/') || pathname.startsWith('/p/');
}

export function isUnauthenticatedPathname(
  pathname: string | null | undefined,
): boolean {
  if (!pathname) return false;
  return (
    isCatalogPathname(pathname)
  );
}

export function colorModeStorageKeyForPath(
  pathname: string | null | undefined,
): string {
  return isCatalogPathname(pathname)
    ? CATALOG_COLOR_MODE_STORAGE_KEY
    : PANEL_COLOR_MODE_STORAGE_KEY;
}

export function colorModeCookieNameForPath(
  pathname: string | null | undefined,
): string {
  return isCatalogPathname(pathname)
    ? CATALOG_COLOR_MODE_COOKIE_NAME
    : PANEL_COLOR_MODE_COOKIE_NAME;
}

export function cookieNameForStorageKey(storageKey: string): string {
  return storageKey === CATALOG_COLOR_MODE_STORAGE_KEY
    ? CATALOG_COLOR_MODE_COOKIE_NAME
    : PANEL_COLOR_MODE_COOKIE_NAME;
}

/**
 * Script blocking: aplica `.dark` + cookie do **painel** antes do paint.
 * Em `/agents/*` o bootstrap do catálogo assume o controle.
 */
export const COLOR_MODE_BOOTSTRAP_SCRIPT = `(function(){try{var p=location.pathname||'';if(p.indexOf('/agents/')===0||p.indexOf('/p/')===0){return;}var k=${JSON.stringify(
  PANEL_COLOR_MODE_STORAGE_KEY,
)};var ck=${JSON.stringify(PANEL_COLOR_MODE_COOKIE_NAME)};var t=localStorage.getItem(k);if(t!=='dark'&&t!=='light'){var parts=document.cookie.split(';');for(var i=0;i<parts.length;i++){var pair=parts[i].trim().split('=');if(pair[0]===ck){t=decodeURIComponent(pair[1]||'');break;}}}if(t!=='dark'&&t!=='light'){t='light';}var d=document.documentElement;if(t==='dark'){d.classList.add('dark');}else{d.classList.remove('dark');}document.cookie=ck+'='+encodeURIComponent(t)+';path=/;max-age=${COLOR_MODE_COOKIE_MAX_AGE};SameSite=Lax';try{localStorage.setItem(k,t);}catch(e2){}}catch(e){}})();`;

/** FOUC do catálogo público — chave separada do painel. */
export const CATALOG_COLOR_MODE_BOOTSTRAP_SCRIPT = `(function(){try{var p=location.pathname||'';if(p.indexOf('/agents/')!==0&&p.indexOf('/p/')!==0)return;var k=${JSON.stringify(
  CATALOG_COLOR_MODE_STORAGE_KEY,
)};var ck=${JSON.stringify(CATALOG_COLOR_MODE_COOKIE_NAME)};var t=localStorage.getItem(k);if(t!=='dark'&&t!=='light'){var parts=document.cookie.split(';');for(var i=0;i<parts.length;i++){var pair=parts[i].trim().split('=');if(pair[0]===ck){t=decodeURIComponent(pair[1]||'');break;}}}if(t!=='dark'&&t!=='light'){t='light';}var d=document.documentElement;if(t==='dark'){d.classList.add('dark');}else{d.classList.remove('dark');}document.cookie=ck+'='+encodeURIComponent(t)+';path=/;max-age=${COLOR_MODE_COOKIE_MAX_AGE};SameSite=Lax';try{localStorage.setItem(k,t);}catch(e2){}}catch(e){}})();`;
