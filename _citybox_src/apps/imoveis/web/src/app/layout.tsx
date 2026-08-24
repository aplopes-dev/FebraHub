import type { Metadata, Viewport } from 'next';
import { cookies, headers } from 'next/headers';
import { Manrope } from 'next/font/google';
import { Toaster } from '@citybox/mui';
import './globals.css';
import {
  ACCENT_COOKIE_NAME,
  getHtmlAccentAttributes,
  parseAccentColorId,
} from '@/features/settings/data/accent-presets';
import { BootstrapScripts } from '@/components/bootstrap-scripts';
import {
  CATALOG_COLOR_MODE_COOKIE_NAME,
  isCatalogPathname,
  PANEL_COLOR_MODE_COOKIE_NAME,
  parseColorMode,
  type ColorMode,
} from '@/lib/color-mode-shared';
import { AppProviders } from './providers';
import { getPublicAppOrigin } from '@/lib/public-app-url';

/** Manrope — Design Guide Listify (tipografia). CSS var `--font-app-sans`. */
const appSans = Manrope({
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-app-sans',
});

export const metadata: Metadata = {
  metadataBase: new URL(getPublicAppOrigin()),
  title: {
    default: 'Citybox Imóveis',
    template: '%s - Citybox Imóveis',
  },
  description: 'Painel de gestão de leads, imóveis e negócios para corretores',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

function colorModeClass(mode: ColorMode): string {
  return mode === 'dark' ? ' dark' : '';
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') ?? '';
  const initialAccentColorId = parseAccentColorId(
    cookieStore.get(ACCENT_COOKIE_NAME)?.value,
  );
  const { accentAttr, customHex } = getHtmlAccentAttributes(initialAccentColorId);

  const catalog = isCatalogPathname(pathname);
  const initialColorMode = parseColorMode(
    cookieStore.get(
      catalog ? CATALOG_COLOR_MODE_COOKIE_NAME : PANEL_COLOR_MODE_COOKIE_NAME,
    )?.value,
    'light',
  );

  return (
    <html
      lang="pt-BR"
      className={`${appSans.variable}${colorModeClass(initialColorMode)}`}
      data-accent={accentAttr}
      {...(customHex ? { 'data-accent-custom': customHex } : {})}
      suppressHydrationWarning
    >
      <body
        className="min-h-svh bg-background font-sans text-foreground antialiased"
        suppressHydrationWarning
      >
        {/* Antes do React — FOUC de tema/accent. Fora de <head> para não
            colidir com o MetadataWrapper do App Router. */}
        <BootstrapScripts />
        {customHex ? (
          <style
            dangerouslySetInnerHTML={{
              __html: `:root,[data-accent-custom="${customHex}"]{--primary:${customHex};--ring:${customHex};--chart-revenue:${customHex};--sidebar-primary:${customHex};--sidebar-ring:${customHex};}`,
            }}
          />
        ) : null}
        <AppProviders
          initialAccentColorId={initialAccentColorId}
          initialColorMode={initialColorMode}
        >
          {children}
          <Toaster richColors position="bottom-right" />
        </AppProviders>
      </body>
    </html>
  );
}
