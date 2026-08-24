/** Presets de cor de destaque (marca) — tokens OKLCH alinhados a `styles/theme.css`. */

import {
  applyCustomAccentCssVariables,
  clearCustomAccentCssVariables,
  isCustomAccentHex,
  normalizeAccentHex,
  type CustomAccentHex,
} from './accent-custom-color';

export const ACCENT_COLOR_IDS = [
  'orange',
  'amber',
  'rose',
  'blue',
  'teal',
  'violet',
  'green',
] as const;

export type AccentColorId = (typeof ACCENT_COLOR_IDS)[number];

/** Preset nomeado ou hex customizado (`#RRGGBB`). */
export type AccentColorValue = AccentColorId | CustomAccentHex;

export const DEFAULT_ACCENT_COLOR_ID: AccentColorId = 'orange';

export const SETTINGS_STORAGE_KEY = 'imoveis.settings.v1';

/** Chave dedicada — bootstrap e leitura rápida sem parse do settings inteiro. */
export const ACCENT_STORAGE_KEY = 'imoveis.accent.v1';

/**
 * Cookie lido no SSR (`cookies()` no layout) — elimina flash laranja do tema MUI.
 * Espelhado em todo persist / bootstrap.
 */
export const ACCENT_COOKIE_NAME = 'imoveis.accent';

const ACCENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 ano

const ACCENT_HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;

function isStoredAccentValue(value: unknown): value is AccentColorValue {
  return isAccentColorId(value) || isCustomAccentHex(value);
}

/** Script blocking — sync `data-accent` + cookie a partir do localStorage. */
export const ACCENT_BOOTSTRAP_SCRIPT = `(function(){try{var presets=${JSON.stringify(
  [...ACCENT_COLOR_IDS],
)};var hexRe=${JSON.stringify(ACCENT_HEX_PATTERN.source)};var hexTest=new RegExp('^'+hexRe+'$');var cookieName=${JSON.stringify(
  ACCENT_COOKIE_NAME,
)};var customAttr='data-accent-custom';function ok(v){return presets.indexOf(v)!==-1||hexTest.test(v);}function applyCustom(hex){document.documentElement.setAttribute('data-accent','custom');document.documentElement.setAttribute(customAttr,hex);var m=hex.match(hexRe);if(!m)return;var r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);document.documentElement.style.setProperty('--primary',hex);document.documentElement.style.setProperty('--ring',hex);document.documentElement.style.setProperty('--chart-revenue',hex);document.documentElement.style.setProperty('--sidebar-primary',hex);document.documentElement.style.setProperty('--sidebar-ring',hex);}function applyPreset(id){document.documentElement.setAttribute('data-accent',id);document.documentElement.removeAttribute(customAttr);['--primary','--primary-foreground','--primary-soft','--primary-soft-foreground','--ring','--chart-revenue','--sidebar-primary','--sidebar-primary-foreground','--sidebar-ring'].forEach(function(k){document.documentElement.style.removeProperty(k);});}var id=localStorage.getItem(${JSON.stringify(
  ACCENT_STORAGE_KEY,
)});if(!ok(id)){var raw=localStorage.getItem(${JSON.stringify(
  SETTINGS_STORAGE_KEY,
)});if(raw){var parsed=JSON.parse(raw);id=parsed&&parsed.system&&parsed.system.accentColorId;}}if(!ok(id)){var parts=document.cookie.split(';');for(var i=0;i<parts.length;i++){var p=parts[i].trim().split('=');if(p[0]===cookieName){id=decodeURIComponent(p[1]||'');break;}}}if(ok(id)){if(hexTest.test(id)){applyCustom(id.toUpperCase());}else{applyPreset(id);}document.cookie=cookieName+'='+encodeURIComponent(id)+';path=/;max-age=${ACCENT_COOKIE_MAX_AGE};SameSite=Lax';try{localStorage.setItem(${JSON.stringify(
  ACCENT_STORAGE_KEY,
)},id);}catch(e2){}}}catch(e){}})();`;

export type AccentColorPreset = {
  id: AccentColorId;
  label: string;
  /** Amostra visual (swatch) — hex só para UI/preview e TopLoader. */
  swatch: string;
  /** Cor do NextTopLoader (barra de progresso). */
  loaderColor: string;
};

export const ACCENT_COLOR_PRESETS: readonly AccentColorPreset[] = [
  {
    id: 'orange',
    label: 'Laranja',
    swatch: '#ff8415',
    loaderColor: '#ff8415',
  },
  {
    id: 'amber',
    label: 'Âmbar',
    swatch: '#e8a017',
    loaderColor: '#e8a017',
  },
  {
    id: 'rose',
    label: 'Rosa',
    swatch: '#e11d48',
    loaderColor: '#e11d48',
  },
  {
    id: 'blue',
    label: 'Azul',
    swatch: '#2563eb',
    loaderColor: '#2563eb',
  },
  {
    id: 'teal',
    label: 'Turquesa',
    swatch: '#0d9488',
    loaderColor: '#0d9488',
  },
  {
    id: 'violet',
    label: 'Violeta',
    swatch: '#7c3aed',
    loaderColor: '#7c3aed',
  },
  {
    id: 'green',
    label: 'Verde',
    swatch: '#16a34a',
    loaderColor: '#16a34a',
  },
] as const;

export function isAccentColorId(value: unknown): value is AccentColorId {
  return (
    typeof value === 'string' &&
    (ACCENT_COLOR_IDS as readonly string[]).includes(value)
  );
}

export function isValidAccentColor(value: unknown): value is AccentColorValue {
  return isAccentColorId(value) || isCustomAccentHex(value);
}

export function getAccentColorPreset(id: AccentColorId): AccentColorPreset {
  return (
    ACCENT_COLOR_PRESETS.find((preset) => preset.id === id) ??
    ACCENT_COLOR_PRESETS[0]
  );
}

/** Aceita preset, hex customizado ou valor inválido → default laranja. */
export function parseAccentColorId(value: unknown): AccentColorValue {
  if (isAccentColorId(value)) return value;
  if (typeof value === 'string') {
    const normalized = normalizeAccentHex(value);
    if (normalized) return normalized;
  }
  return DEFAULT_ACCENT_COLOR_ID;
}

const ACCENT_ATTR = 'data-accent';
export const CUSTOM_ACCENT_DOM_VALUE = 'custom';

export function getAccentLoaderColor(value: AccentColorValue): string {
  if (isCustomAccentHex(value)) return value;
  return getAccentColorPreset(value).loaderColor;
}

export function getHtmlAccentAttributes(value: AccentColorValue): {
  accentAttr: string;
  customHex?: CustomAccentHex;
} {
  if (isCustomAccentHex(value)) {
    return { accentAttr: CUSTOM_ACCENT_DOM_VALUE, customHex: value };
  }
  return { accentAttr: value };
}

/**
 * Só DOM — **não** grava storage.
 * Gravar no apply do sync pré-hidratação apagava a cor salva (seed laranja).
 */
export function applyAccentColor(
  value: AccentColorValue,
  mode: 'light' | 'dark' = 'light',
): void {
  if (typeof document === 'undefined') return;
  if (isCustomAccentHex(value)) {
    document.documentElement.setAttribute(ACCENT_ATTR, CUSTOM_ACCENT_DOM_VALUE);
    applyCustomAccentCssVariables(value, mode);
    return;
  }
  clearCustomAccentCssVariables();
  document.documentElement.setAttribute(ACCENT_ATTR, value);
}

function writeAccentCookie(value: AccentColorValue): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${ACCENT_COOKIE_NAME}=${encodeURIComponent(value)}; path=/; max-age=${ACCENT_COOKIE_MAX_AGE}; SameSite=Lax`;
}

/** Persiste a escolha do usuário (localStorage + cookie para SSR). */
export function persistAccentColorId(value: AccentColorValue): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ACCENT_STORAGE_KEY, value);
  } catch {
    // Quota / private mode.
  }
  writeAccentCookie(value);
}

export function applyAndPersistAccentColor(
  value: AccentColorValue,
  mode: 'light' | 'dark' = 'light',
): void {
  applyAccentColor(value, mode);
  persistAccentColorId(value);
}

export function readAccentColorFromDom(): AccentColorValue {
  if (typeof document === 'undefined') return DEFAULT_ACCENT_COLOR_ID;
  const custom = document.documentElement.getAttribute('data-accent-custom');
  if (isCustomAccentHex(custom)) return custom;
  const value = document.documentElement.getAttribute(ACCENT_ATTR);
  if (isAccentColorId(value)) return value;
  return DEFAULT_ACCENT_COLOR_ID;
}

/** Lê a cor persistida (chave dedicada → settings → DOM). */
export function readPersistedAccentColorId(): AccentColorValue {
  if (typeof window === 'undefined') return DEFAULT_ACCENT_COLOR_ID;
  try {
    const quick = window.localStorage.getItem(ACCENT_STORAGE_KEY);
    if (isStoredAccentValue(quick)) return quick;
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { system?: { accentColorId?: unknown } };
      return parseAccentColorId(parsed?.system?.accentColorId);
    }
  } catch {
    // ignore
  }
  return readAccentColorFromDom();
}

export { isCustomAccentHex, normalizeAccentHex };
export type { CustomAccentHex };
