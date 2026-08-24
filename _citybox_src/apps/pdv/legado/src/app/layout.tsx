import type { Metadata, Viewport } from 'next';
import { AppShell } from '@/components/app-shell';
import { SerwistProvider } from '@/components/serwist-provider';
import { ToastProvider } from '@/components/toast';
import './globals.css';

const APP_NAME = 'Citybox PDV';
const APP_DEFAULT_TITLE = 'Citybox PDV';
const APP_TITLE_TEMPLATE = '%s · Citybox PDV';
const APP_DESCRIPTION =
  'Ponto de venda Citybox para food e varejo — instalável como PWA.';

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_DEFAULT_TITLE,
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  other: {
    // Android Chrome: sugere UI fullscreen quando instalado
    'mobile-web-app-capable': 'yes',
  },
  icons: {
    icon: [
      { url: '/icons/icon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
  },
};

/**
 * Viewport travado: sem zoom acidental no caixa (tablet/touch).
 * `viewportFit: cover` + safe-area no shell cobrem notch / home indicator.
 */
export const viewport: Viewport = {
  themeColor: '#F7F7F7',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      data-theme="pdv"
      className="h-full overscroll-none"
      suppressHydrationWarning
    >
      <body className="h-full overscroll-none select-none touch-manipulation bg-background font-sans text-foreground antialiased">
        <SerwistProvider swUrl="/serwist/sw.js">
          <ToastProvider>
            <AppShell scrollable={false}>{children}</AppShell>
          </ToastProvider>
        </SerwistProvider>
      </body>
    </html>
  );
}
