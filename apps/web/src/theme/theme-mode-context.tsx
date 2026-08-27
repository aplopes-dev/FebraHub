"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_THEME_MODE,
  THEME_MODE_COOKIE,
  THEME_MODE_COOKIE_MAX_AGE,
  type ThemeMode,
} from "./theme-mode";

type ThemeModeContextValue = {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

function persist(mode: ThemeMode) {
  document.cookie = `${THEME_MODE_COOKIE}=${mode}; path=/; max-age=${THEME_MODE_COOKIE_MAX_AGE}; SameSite=Lax`;
}

/**
 * Modo de cor da sessão.
 *
 * `initialMode` vem do servidor (cookie), então o primeiro render do cliente
 * já nasce no modo certo — sem estado "ainda não sei", sem `mounted`, sem
 * divergência de hidratação.
 *
 * A classe no `<html>` acompanha a troca porque `color-scheme` (scrollbars e
 * controles nativos) vive no CSS, não no MUI.
 */
export function ThemeModeProvider({
  initialMode,
  children,
}: {
  initialMode: ThemeMode;
  children: ReactNode;
}) {
  const [mode, setModeState] = useState<ThemeMode>(initialMode);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    persist(next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }, []);

  const value = useMemo<ThemeModeContextValue>(
    () => ({
      mode,
      isDark: mode === "dark",
      setMode,
      toggleMode: () => setMode(mode === "dark" ? "light" : "dark"),
    }),
    [mode, setMode],
  );

  return (
    <ThemeModeContext.Provider value={value}>
      {children}
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode(): ThemeModeContextValue {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) {
    // Fora do provider (um componente isolado em teste), o modo padrão é o
    // claro e a troca não faz nada — melhor que derrubar a árvore.
    return {
      mode: DEFAULT_THEME_MODE,
      isDark: false,
      setMode: () => undefined,
      toggleMode: () => undefined,
    };
  }
  return ctx;
}
