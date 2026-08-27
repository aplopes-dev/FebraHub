import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import ShellPdvMovel from "./ShellPdvMovel";

/* Metadados/viewport DO SEGMENTO (server component — por isso este layout não é
   "use client"). O Next mescla estes com os do root:
   - viewportFit:"cover" → env(safe-area-inset-*) reportam os valores reais do
     notch / gesture bar. Fica no HTML inicial (sem flicker, sem depender de
     efeito pós-hidratação como antes) e sobrevive à navegação PWA.
   - format-detection: telephone/date/address=no → impede o iOS de transformar
     nomes de produto com números em link azul clicável. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "PDV · FebraHub",
  other: { "format-detection": "telephone=no, date=no, address=no, email=no" },
};

export default function LayoutPdvMovel({ children }: { children: ReactNode }) {
  return <ShellPdvMovel>{children}</ShellPdvMovel>;
}
