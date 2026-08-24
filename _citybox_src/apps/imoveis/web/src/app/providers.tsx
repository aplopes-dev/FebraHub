'use client';

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import NextTopLoader from 'nextjs-toploader';
import {
  AppRouterCacheProvider,
  CityboxMuiProvider,
  createAppTheme,
} from '@citybox/mui/theme';
import { AccentThemeSync } from '@/features/settings/components/accent-theme-sync';
import { SettingsBootstrap } from '@/features/settings/components/settings-bootstrap';
import {
  DEFAULT_ACCENT_COLOR_ID,
  type AccentColorValue,
} from '@/features/settings/data/accent-presets';
import {
  getSettingsVersion,
  getSystemFromStore,
  isSettingsHydratedFromStorage,
  subscribeSettings,
} from '@/features/settings/data/settings-store';
import { createQueryClient } from '@/lib/query-client';
import { AuthSessionProvider } from '@/lib/session-context';
import { PermissionsProvider } from '@/lib/permissions-context';
import { StoreProvider } from '@/lib/store-context';
import { ColorModeProvider, useTheme, type ColorMode } from '@/lib/color-mode';
import { resolveAccentPalette } from '@/theme/accent-color';
import {
  imoveisDarkPaletteOverrides,
  imoveisMuiThemeOptions,
} from '@/theme/imoveis-mui-theme';
import { imoveisSemanticPaletteDark } from '@/theme/semantic-palette';

const InitialAccentContext = createContext<AccentColorValue>(DEFAULT_ACCENT_COLOR_ID);
const InitialColorModeContext = createContext<ColorMode>('light');

function useAccentColorId(): AccentColorValue {
  const initialAccent = useContext(InitialAccentContext);
  const version = useSyncExternalStore(
    subscribeSettings,
    getSettingsVersion,
    () => 0,
  );
  void version;

  // Antes da hidratação do localStorage: cookie/SSR (sem flash laranja).
  if (!isSettingsHydratedFromStorage()) {
    return initialAccent;
  }
  return getSystemFromStore().accentColorId;
}

function ImoveisMuiThemeProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const initialColorMode = useContext(InitialColorModeContext);
  // SSR + 1º paint: prefer cookie; depois o provider resolve localStorage.
  const mode =
    resolvedTheme === 'dark' || resolvedTheme === 'light'
      ? resolvedTheme
      : initialColorMode;
  const accentColorId = useAccentColorId();

  const dynamicTheme = useMemo(() => {
    const primary = resolveAccentPalette(accentColorId, mode);

    return createAppTheme(imoveisMuiThemeOptions, {
      palette: {
        mode,
        primary,
        ...(mode === 'dark'
          ? {
              ...imoveisDarkPaletteOverrides,
              ...imoveisSemanticPaletteDark,
            }
          : {}),
      },
    });
  }, [accentColorId, mode]);

  return (
    <CityboxMuiProvider theme={dynamicTheme} withCssBaseline>
      {children}
    </CityboxMuiProvider>
  );
}

type AppProvidersProps = {
  children: ReactNode;
  /** Accent do cookie SSR — evita flash do default laranja no reload. */
  initialAccentColorId?: AccentColorValue;
  /** Tema do cookie SSR — evita flash light→dark no MUI. */
  initialColorMode?: ColorMode;
};

export function AppProviders({
  children,
  initialAccentColorId = DEFAULT_ACCENT_COLOR_ID,
  initialColorMode = 'light',
}: AppProvidersProps) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <InitialAccentContext.Provider value={initialAccentColorId}>
      <InitialColorModeContext.Provider value={initialColorMode}>
        <AuthSessionProvider>
          <PermissionsProvider>
            <StoreProvider>
              <QueryClientProvider client={queryClient}>
                <AppRouterCacheProvider>
                  <ColorModeProvider
                    defaultTheme="light"
                    initialTheme={initialColorMode}
                  >
                    <ImoveisMuiThemeProvider>
                      <AccentThemeSync initialAccentColorId={initialAccentColorId} />
                      <SettingsBootstrap />
                      <NextTopLoader color="var(--primary)" height={3} showSpinner={false} />
                      {children}
                    </ImoveisMuiThemeProvider>
                  </ColorModeProvider>
                </AppRouterCacheProvider>
              </QueryClientProvider>
            </StoreProvider>
          </PermissionsProvider>
        </AuthSessionProvider>
      </InitialColorModeContext.Provider>
    </InitialAccentContext.Provider>
  );
}
