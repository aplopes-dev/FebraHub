import type { Metadata, Viewport } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import "./globals.css";

/* As duas famílias do design. Antes vinham por @import do Google Fonts dentro
   de um <style> no Shell — o que bloqueia o primeiro paint e depende da rede
   do cliente. Aqui o Next baixa e serve as fontes do próprio domínio, e a
   variável CSS é o que src/lib/tema.ts referencia. */
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--fonte-sans",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--fonte-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "FebraHub · Febracis Salvador",
    template: "%s · FebraHub",
  },
  description:
    "Portal corporativo interno da Febracis Salvador. Cada setor vê o próprio hub; a diretoria vê o consolidado.",
  applicationName: "FebraHub",
  icons: { icon: [{ url: "/logo-febracis.webp", type: "image/webp" }] },
  // Sistema interno: nada aqui deve ser indexado ou pré-visualizado.
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // O painel é dark fixo — não existe tema claro no design.
  colorScheme: "dark",
  themeColor: "#08080A",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${manrope.variable} ${spaceGrotesk.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
