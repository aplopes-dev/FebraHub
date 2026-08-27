"use client";

import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { BOTAO_OURO, BOTAO_OURO_OFF, BOTAO_SECUNDARIO } from "./estilos";

type Variante = "ouro" | "secundario";

/** CTA padrão do sistema — dourado em gradiente (pílula) ou secundário. */
export function BotaoPrimario({
  children,
  variante = "ouro",
  pronto = true,
  carregando = false,
  style,
  disabled,
  type = "button",
  ...rest
}: {
  children: ReactNode;
  variante?: Variante;
  /** Só para variante ouro: false aplica a pintura apagada. */
  pronto?: boolean;
  carregando?: boolean;
  style?: CSSProperties;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "style" | "children">) {
  const parado = disabled || carregando || (variante === "ouro" && !pronto);
  const base =
    variante === "secundario"
      ? BOTAO_SECUNDARIO
      : pronto && !carregando && !disabled
        ? BOTAO_OURO
        : BOTAO_OURO_OFF;

  return (
    <button
      type={type}
      disabled={parado}
      style={{ ...base, ...style }}
      {...rest}
    >
      {carregando ? <Loader2 size={13} className="girar" /> : null}
      {children}
    </button>
  );
}
