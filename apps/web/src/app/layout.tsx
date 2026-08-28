import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Manrope } from "next/font/google";
import { Toaster } from "@/ui";
import {
  BORDER_COLOR,
  BORDER_COLOR_DARK,
  THEME_MODE_COOKIE,
  appDefaultBrandColor,
  parseThemeMode,
} from "@/theme";
import { AppProviders } from "./providers";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
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
        mode === "dark" ? `${manrope.variable} dark` : manrope.variable
      }
      // Marca e traço já no primeiro byte, para quem pinta fora do MUI (a
      // barra de progresso, regras de `globals.css`) não piscar antes do JS
      // subir. O traço é o mesmo `BORDER_COLOR` que alimenta o tema.
      style={
        {
          "--primary": appDefaultBrandColor,
          "--border": mode === "dark" ? BORDER_COLOR_DARK : BORDER_COLOR,
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
