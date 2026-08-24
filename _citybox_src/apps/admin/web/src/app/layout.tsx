import type { Metadata } from 'next';
import { Toaster } from '@citybox/ui/atoms';
import './globals.css';

export const metadata: Metadata = {
  title: 'Citybox - Administração',
  description: 'Administração da plataforma Citybox',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="admin">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <div className="admin-ambient-glow" aria-hidden="true" />
        {children}
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
