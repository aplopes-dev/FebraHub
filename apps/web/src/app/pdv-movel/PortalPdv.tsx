"use client";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * PortalPdv — renderiza overlays (sheets/modais do PDV móvel) num nó no fim do
 * <body>, FORA da .pm-main (que é um container de scroll com overflow) e ACIMA
 * da bottom-nav. Sem isso os overlays herdavam o contexto de empilhamento do
 * conteúdo rolável e ficavam cobertos pela navbar / recebiam toques por baixo.
 *
 * O nó `.pm-portal` reaplica os tokens de tema `.pm` (via CSS) porque, no body,
 * ele não está mais dentro de `.pm`.
 */
export function PortalPdv({ children }: { children: ReactNode }) {
  const [montado, setMontado] = useState(false);
  useEffect(() => {
    setMontado(true);
    // Trava o scroll do documento enquanto um overlay está aberto.
    const html = document.documentElement;
    html.classList.add("pm-overlay-aberto");
    return () => { html.classList.remove("pm-overlay-aberto"); };
  }, []);
  if (!montado) return null;
  return createPortal(<div className="pm pm-portal">{children}</div>, document.body);
}
