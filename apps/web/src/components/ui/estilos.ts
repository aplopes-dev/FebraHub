import type { CSSProperties } from "react";
import { C, SANS, alfa } from "@/lib/tema";

/** Item de lista dentro de um Popover (seletores de ano/mês/produto). */
export const itemPop = (ativo: boolean): CSSProperties => ({
  display: "block", width: "100%", textAlign: "left", padding: "7px 10px",
  borderRadius: 7, border: "none", cursor: "pointer", fontFamily: SANS,
  fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
  background: ativo ? alfa("gold", 0.12) : "transparent",
  color: ativo ? C.gold : C.muted,
});

// Estilos de formulário reaproveitados nos modais.
export const inputAv: CSSProperties = {
  width: "100%", background: alfa("sup", 0.04), border: `1px solid ${C.cardLine}`,
  borderRadius: 9, padding: "9px 11px", color: C.text, fontFamily: SANS, fontSize: 13,
};

export const labelAv: CSSProperties = {
  fontSize: 10.5, fontWeight: 700, color: C.muted, textTransform: "uppercase",
  letterSpacing: ".4px", marginBottom: 4, display: "block",
};
