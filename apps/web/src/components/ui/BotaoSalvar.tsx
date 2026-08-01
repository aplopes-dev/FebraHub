"use client";

import type { ReactNode } from "react";
import { Check, Loader2 } from "lucide-react";
import { C, SANS, SOBRE_OURO_2, alfa } from "@/lib/tema";

// Botão primário/erro reutilizado nos modais.
export function BotaoSalvar({
  onClick, disabled, salvando, children,
}: {
  onClick: () => void;
  disabled?: boolean;
  salvando?: boolean;
  children: ReactNode;
}) {
  return (
    <button onClick={onClick} disabled={disabled || salvando} style={{
      display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10, border: "none",
      background: disabled || salvando ? alfa("sup", 0.08) : `linear-gradient(90deg, ${C.goldTop}, ${C.goldBase})`,
      color: disabled || salvando ? C.faint : SOBRE_OURO_2, fontWeight: 800, fontSize: 13, fontFamily: SANS,
      cursor: disabled || salvando ? "default" : "pointer",
    }}>
      {salvando ? <Loader2 size={14} className="girar" /> : <Check size={14} />} {children}
    </button>
  );
}
