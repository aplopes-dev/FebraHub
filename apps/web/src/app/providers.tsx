"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import NextTopLoader from "nextjs-toploader";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  AppRouterCacheProvider,
  AppThemeProvider,
  createAppTheme,
} from "@/ui/theme";
import {
  ThemeModeProvider,
  appThemeDarkOptions,
  appThemeOptions,
  readDefaultBrandColor,
  readStoredBrandColor,
  resolveBrandPalette,
  subscribeBrandColor,
  useThemeMode,
  type ThemeMode,
} from "@/theme";
import { OrganizationProvider } from "@/lib/organization-context";

/** Cor de marca escolhida pelo usuário (localStorage + evento). */
function useBrandColor(): string {
  return useSyncExternalStore(
    subscribeBrandColor,
    readStoredBrandColor,
    readDefaultBrandColor,
  );
}

/**
 * Tema do preset ativo com a cor de marca por cima.
 *
 * A cor entra aqui, e não no preset, porque é escolha do usuário em runtime —
 * o preset guarda tudo que é decisão de design do sistema.
 */
function BrandedThemeProvider({
  brandColor,
  children,
}: {
  brandColor: string;
  children: React.ReactNode;
}) {
  const { mode, isDark } = useThemeMode();

  // A marca é a mesma nos dois modos — o botão primário no escuro tem a cor
  // que tem no claro. `--primary` e `--primary-gradient` acompanham, para quem
  // pinta fora do MUI (a barra de progresso de navegação).
  const brandPalette = useMemo(
    () => resolveBrandPalette(brandColor),
    [brandColor],
  );

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--primary", brandPalette.main);
    // Sem degradê (cor chapada do catálogo), a var cai na própria cor — quem
    // usa `var(--primary-gradient)` como `background-image` não precisa saber
    // se a marca é metálica.
    root.style.setProperty(
      "--primary-gradient",
      brandPalette.gradient ?? brandPalette.main,
    );
  }, [brandPalette]);

  const theme = useMemo(
    () =>
      createAppTheme(appThemeOptions, isDark ? appThemeDarkOptions : {}, {
        palette: {
          mode,
          primary: {
            main: brandPalette.main,
            light: brandPalette.light,
            dark: brandPalette.dark,
            contrastText: brandPalette.contrastText,
            gradient: brandPalette.gradient,
            gradientHover: brandPalette.gradientHover,
          },
        },
      }),
    [brandPalette, isDark, mode],
  );

  return (
    <AppThemeProvider theme={theme} withCssBaseline={false}>
      {children}
    </AppThemeProvider>
  );
}

export function AppProviders({
  children,
  initialMode,
}: {
  children: React.ReactNode;
  /** Modo de cor lido do cookie no servidor — ver `theme/theme-mode.ts`. */
  initialMode: ThemeMode;
}) {
  const brandColor = useBrandColor();

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <OrganizationProvider>
        <AppRouterCacheProvider>
          <ThemeModeProvider initialMode={initialMode}>
            <BrandedThemeProvider brandColor={brandColor}>
              <NextTopLoader
                color="var(--primary)"
                height={4}
                showSpinner={false}
              />
              {children}
            </BrandedThemeProvider>
          </ThemeModeProvider>
        </AppRouterCacheProvider>
      </OrganizationProvider>
    </QueryClientProvider>
  );
}
