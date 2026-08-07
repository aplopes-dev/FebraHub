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
  // Vira <meta name="color-scheme" content="light dark">: é o que faz os
  // controles NATIVOS (scrollbar, input, date picker) acompanharem o tema.
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF8F5" },
    { media: "(prefers-color-scheme: dark)", color: "#08080A" },
  ],
};

/* Tema ANTES da primeira pintura. Script inline BLOQUEANTE, primeiro filho do
   <body> (o <head> do App Router é montado pelo Next; escrever um à mão só
   arruma briga). Ele roda antes de o resto do <body> ser parseado, então
   nenhum pixel é pintado com o tema errado — se a decisão esperasse a
   hidratação, o painel piscaria escuro→claro a cada navegação. São ~8 linhas,
   sem rede, sem dependência.

   Ele NÃO é suficiente sozinho: o React apaga o `data-tema` no commit de
   hidratação (o atributo não existe no HTML do servidor). Quem devolve é o
   `useAplicarTema()` do Providers, num layout effect do mesmo commit — ver a
   explicação em src/hooks/tema.ts. A chave e a regra de decisão aqui e lá
   PRECISAM ser as mesmas. */
const SCRIPT_TEMA = `(function(){try{var t=localStorage.getItem("febrahub:tema");if(t!=="claro"&&t!=="escuro"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"escuro":"claro";}document.documentElement.setAttribute("data-tema",t);}catch(e){document.documentElement.setAttribute("data-tema","escuro");}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning: o script abaixo escreve `data-tema` no <html>
    // antes do React hidratar, então o atributo diverge do HTML do servidor
    // de propósito.
    <html
      lang="pt-BR"
      className={`${manrope.variable} ${spaceGrotesk.variable}`}
      suppressHydrationWarning
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
