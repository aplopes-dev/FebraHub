'use client';

import { useState, useMemo, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, useTheme } from 'next-themes';
import NextTopLoader from 'nextjs-toploader';
import {
  AppRouterCacheProvider,
  CityboxMuiProvider,
  createAppTheme,
} from '@citybox/mui/theme';
import { createQueryClient } from '@/lib/query-client';
import { SessionProvider } from '@/lib/session-context';
import { StoreProvider } from '@/lib/store-context';
import { StoreThemeProvider, useStoreTheme } from '@/theme/theme-store-context';

function BeautifulMuiThemeProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const { currentPreset } = useStoreTheme();
  const htmlIsDark =
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark');
  const mode =
    resolvedTheme === 'dark' || resolvedTheme === 'light'
      ? resolvedTheme
      : htmlIsDark
        ? 'dark'
        : 'light';

  const theme = useMemo(
    () => createAppTheme(currentPreset[mode]),
    [currentPreset, mode],
  );

  return (
    <CityboxMuiProvider theme={theme} withCssBaseline>
      <NextTopLoader
        key={currentPreset.id}
        color={currentPreset.topLoaderColor}
        height={3}
        showSpinner={false}
      />
      {children}
    </CityboxMuiProvider>
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <SessionProvider>
      <StoreProvider>
        <QueryClientProvider client={queryClient}>
          <StoreThemeProvider>
            <AppRouterCacheProvider>
              <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
                <BeautifulMuiThemeProvider>{children}</BeautifulMuiThemeProvider>
              </ThemeProvider>
            </AppRouterCacheProvider>
          </StoreThemeProvider>
        </QueryClientProvider>
      </StoreProvider>
    </SessionProvider>
  );
}
