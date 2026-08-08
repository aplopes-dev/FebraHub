"use client";

import type { ReactNode } from "react";
import { Check, Loader2 } from "lucide-react";
import { BOTAO_OURO, BOTAO_OURO_OFF } from "./estilos";

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
      ...(parado ? BOTAO_OURO_OFF : BOTAO_OURO),
      padding: "9px 18px",
      fontSize: 13,
    }}>
      {salvando ? <Loader2 size={14} className="girar" /> : <Check size={14} />} {children}
    </button>
  );
}
