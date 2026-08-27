import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Archivo } from "next/font/google";
import { Toaster } from "@/ui";
import {
  THEME_MODE_COOKIE,
  appDefaultBrandColor,
  appDefaultBrandGradient,
  parseThemeMode,
} from "@/theme";
import { AppProviders } from "./providers";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-archivo",
});

export const metadata: Metadata = {
  title: {
    default: "FebraHub",
    template: "%s · FebraHub",
  },
  description: "Backoffice do FebraHub",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // O modo de cor sai do cookie no servidor: o HTML já vai na cor certa e o
  // cliente hidrata sem divergir. Ver `theme/theme-mode.ts`.
  const mode = parseThemeMode((await cookies()).get(THEME_MODE_COOKIE)?.value);

  return (
    <html
      lang="pt-BR"
      className={
        mode === "dark" ? `${archivo.variable} dark` : archivo.variable
      }
      // Cor de marca do preset já no primeiro byte, para a barra de progresso
      // não piscar no cinza de `globals.css` antes do JS subir.
      style={
        {
          "--primary": appDefaultBrandColor,
          "--primary-gradient": appDefaultBrandGradient,
        } as CSSProperties
      }
      suppressHydrationWarning
    >
      <body style={{ height: "100svh", overflow: "hidden" }}>
        <AppProviders initialMode={mode}>
          {children}
          <Toaster position="top-center" template="progress" />
        </AppProviders>
      </body>
    </html>
  );
}
