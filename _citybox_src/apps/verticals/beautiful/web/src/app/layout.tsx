import type { Metadata } from 'next';
import { Toaster } from '@citybox/mui';
import { AppProviders } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Beautiful',
    template: '%s · Beautiful',
  },
  description: 'Vertical Beautiful — scaffold Citybox',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <AppProviders>
          {children}
          <Toaster richColors position="bottom-right" />
        </AppProviders>
      </body>
    </html>
  );
}
