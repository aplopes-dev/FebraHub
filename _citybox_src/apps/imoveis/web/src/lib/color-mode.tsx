'use client';

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import {
  type ColorMode,
  colorModeStorageKeyForPath,
  cookieNameForStorageKey,
  isColorMode,
} from './color-mode-shared';

export type { ColorMode } from './color-mode-shared';
export {
  CATALOG_COLOR_MODE_BOOTSTRAP_SCRIPT,
  CATALOG_COLOR_MODE_COOKIE_NAME,
  CATALOG_COLOR_MODE_STORAGE_KEY,
  COLOR_MODE_BOOTSTRAP_SCRIPT,
  COLOR_MODE_COOKIE_MAX_AGE,
  colorModeCookieNameForPath,
  colorModeStorageKeyForPath,
  cookieNameForStorageKey,
  isCatalogPathname,
  isColorMode,
  PANEL_COLOR_MODE_COOKIE_NAME,
  PANEL_COLOR_MODE_STORAGE_KEY,
  parseColorMode,
} from './color-mode-shared';

type ColorModeContextValue = {
  /** Valor persistido (`light` | `dark`). */
  theme: ColorMode | undefined;
  setTheme: (theme: ColorMode) => void;
  /** Igual a `theme` — sem `system` neste app. */
  resolvedTheme: ColorMode | undefined;
};

const ColorModeContext = createContext<ColorModeContextValue | undefined>(
  undefined,
);

const listenersByKey = new Map<string, Set<() => void>>();

function getListeners(storageKey: string) {
  let set = listenersByKey.get(storageKey);
  if (!set) {
    set = new Set();
    listenersByKey.set(storageKey, set);
  }
  return set;
}

function emitColorModeChange(storageKey: string) {
  for (const listener of getListeners(storageKey)) {
    listener();
  }
}

/** Subscribe compartilhado (painel e catálogo usam chaves distintas). */
export function subscribeColorModeStorage(
  storageKey: string,
  callback: () => void,
) {
  getListeners(storageKey).add(callback);
  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey || event.key === null) {
      callback();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    getListeners(storageKey).delete(callback);
    window.removeEventListener('storage', onStorage);
  };
}

export function readStoredColorMode(
  storageKey: string,
  defaultTheme: ColorMode,
): ColorMode {
  try {
    const stored = localStorage.getItem(storageKey);
    if (isColorMode(stored)) {
      return stored;
    }
  } catch {
    // ignore
  }
  return defaultTheme;
}

function writeColorModeCookie(cookieName: string, mode: ColorMode) {
  if (typeof document === 'undefined') return;
  document.cookie = `${cookieName}=${encodeURIComponent(mode)}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

export function writeStoredColorMode(storageKey: string, mode: ColorMode) {
  try {
    localStorage.setItem(storageKey, mode);
  } catch {
    // ignore
  }
  writeColorModeCookie(cookieNameForStorageKey(storageKey), mode);
  emitColorModeChange(storageKey);
}

export function applyColorModeClass(mode: ColorMode) {
  const root = document.documentElement;
  if (mode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

type ColorModeProviderProps = {
  children: ReactNode;
  defaultTheme?: ColorMode;
  /**
   * Tema da rota atual no SSR (cookie). Garante que o MUI renderiza dark
   * no HTML do servidor e não só após hidratar o localStorage.
   */
  initialTheme?: ColorMode;
};

/**
 * Resolve o tema pela rota: /agents/* → `imoveis.catalog.theme`; resto → `theme`.
 * Assim o MUI e o Tailwind do catálogo ficam desacoplados do painel.
 */
export function ColorModeProvider({
  children,
  defaultTheme = 'light',
  initialTheme,
}: ColorModeProviderProps) {
  const pathname = usePathname();
  const storageKey = colorModeStorageKeyForPath(pathname);
  const serverTheme = initialTheme ?? defaultTheme;

  const theme = useSyncExternalStore(
    (cb) => subscribeColorModeStorage(storageKey, cb),
    () => readStoredColorMode(storageKey, serverTheme),
    () => serverTheme,
  );

  useLayoutEffect(() => {
    applyColorModeClass(theme);
    // Mantém cookie = localStorage (próximo SSR já chega dark).
    writeColorModeCookie(cookieNameForStorageKey(storageKey), theme);
  }, [theme, storageKey]);

  const setTheme = useCallback(
    (next: ColorMode) => {
      writeStoredColorMode(storageKey, next);
      applyColorModeClass(next);
    },
    [storageKey],
  );

  const value = useMemo<ColorModeContextValue>(
    () => ({
      theme,
      setTheme,
      resolvedTheme: theme,
    }),
    [theme, setTheme],
  );

  return (
    <ColorModeContext.Provider value={value}>{children}</ColorModeContext.Provider>
  );
}

/** API compatível com o subset usado do `next-themes`. */
export function useTheme(): ColorModeContextValue {
  const context = useContext(ColorModeContext);
  if (!context) {
    return {
      theme: undefined,
      setTheme: () => undefined,
      resolvedTheme: undefined,
    };
  }
  return context;
}
