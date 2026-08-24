import type { Metadata, Viewport } from 'next';
import { Toaster } from '@citybox/ui/atoms';
import './globals.css';
import { AppProviders } from './providers';

export const metadata: Metadata = {
  title: {
    default: 'Citybox Clínica',
    template: '%s - Citybox Clínica',
  },
  description: 'Gestão para clínicas e consultórios — Citybox',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="warm" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="min-h-svh bg-background font-sans text-foreground antialiased"
        suppressHydrationWarning
      >
        <AppProviders>{children}</AppProviders>
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
