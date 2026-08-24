import type { Metadata } from "next";
import { Toaster } from "@citybox/mui";
import { AppProviders } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Citybox ERP Comércio",
    template: "%s · Citybox ERP Comércio",
  },
  description: "Backoffice de comércio — scaffold Citybox",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="h-svh overflow-hidden bg-background font-sans text-foreground antialiased">
        <AppProviders>
          {children}
          <Toaster position="top-center" template="progress" />
        </AppProviders>
      </body>
    </html>
  );
}
