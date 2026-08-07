"use client";

import type { ReactNode } from "react";
import { Check, Loader2 } from "lucide-react";
import { SANS } from "@/lib/tema";
import { PINTURA_OURO, PINTURA_OURO_OFF } from "./estilos";

// Botão primário/erro reutilizado nos modais.
export function BotaoSalvar({
  onClick, disabled, salvando, children,
}: {
  onClick: () => void;
  disabled?: boolean;
  salvando?: boolean;
  children: ReactNode;
}) {
  const parado = disabled || salvando;
  return (
    <button onClick={onClick} disabled={parado} style={{
      display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10,
      ...(parado ? PINTURA_OURO_OFF : PINTURA_OURO),
      fontWeight: 800, fontSize: 13, fontFamily: SANS,
      cursor: parado ? "default" : "pointer",
    }}>
      {salvando ? <Loader2 size={14} className="girar" /> : <Check size={14} />} {children}
    </button>
  );
}
