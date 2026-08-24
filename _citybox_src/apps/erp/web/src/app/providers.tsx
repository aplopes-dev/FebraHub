"use client";

import { useState, useEffect, useMemo } from "react";
import { ThemeProvider, useTheme } from "next-themes";
import NextTopLoader from "nextjs-toploader";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  AppRouterCacheProvider,
  CityboxMuiProvider,
  createAppTheme,
} from "@citybox/mui/theme";
import { BrandFaviconSync } from "@/components/brand-favicon-sync";
import { comercioMuiThemeOptions } from "@/theme/comercio-mui-theme";
import { DEFAULT_BRAND_COLOR, resolveBrandPalette } from "@/theme/brand-color";
import { SessionProvider } from "@/lib/session-context";
import { OrganizationProvider } from "@/lib/organization-context";

function ComercioMuiThemeProvider({
  brandColor,
  children,
}: {
  brandColor: string;
  children: React.ReactNode;
}) {
  const { resolvedTheme } = useTheme();
  const mode = resolvedTheme === "dark" ? "dark" : "light";

  const dynamicTheme = useMemo(() => {
    const palette = resolveBrandPalette(brandColor);

    return createAppTheme(comercioMuiThemeOptions, {
      palette: {
        mode,
        primary: {
          main: palette.main,
          light: palette.light,
          dark: palette.dark,
          contrastText: "#FFFFFF",
        },
      },
    });
  }, [brandColor, mode]);

  return (
    <CityboxMuiProvider theme={dynamicTheme} withCssBaseline={false}>
      {children}
    </CityboxMuiProvider>
  );
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [brandColor, setBrandColor] = useState(DEFAULT_BRAND_COLOR);

  useEffect(() => {
    const saved = localStorage.getItem("company_brand_color");
    if (saved) {
      setBrandColor(saved);
      document.documentElement.style.setProperty("--primary", saved);
    }

    const handleColorUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setBrandColor(customEvent.detail);
        document.documentElement.style.setProperty(
          "--primary",
          customEvent.detail,
        );
      }
    };

    window.addEventListener("brand-color-changed", handleColorUpdate);
    return () => {
      window.removeEventListener("brand-color-changed", handleColorUpdate);
    };
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--primary", brandColor);
  }, [brandColor]);

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
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <OrganizationProvider>
          <AppRouterCacheProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem={false}
            >
              <ComercioMuiThemeProvider brandColor={brandColor}>
                <BrandFaviconSync brandColor={brandColor} />
                <NextTopLoader
                  color="var(--primary)"
                  height={4}
                  showSpinner={false}
                />
                {children}
              </ComercioMuiThemeProvider>
            </ThemeProvider>
          </AppRouterCacheProvider>
        </OrganizationProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
