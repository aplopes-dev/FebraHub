"use client";

import { ChevronDown } from "lucide-react";
import { C, SANS } from "@/lib/tema";

/* Filtro travado — Canal e Status. O controle aparece porque foi pedido no
   desenho, mas desabilitado: o dado que o alimentaria (canal da venda com
   cobertura, status do lead) ainda não existe. */
export function FiltroTravado({ label }: { label: string }) {
  return (
    <button disabled title="em construção — sem fonte para este recorte" style={{
      display: "flex", alignItems: "center", gap: 6, cursor: "not-allowed",
      background: "rgba(255,255,255,.02)", border: `1px dashed ${C.cardLine}`,
      borderRadius: 9, padding: "6px 10px", fontFamily: SANS,
    }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: ".5px" }}>{label}</span>
      <span style={{ fontSize: 11.5, fontWeight: 700, color: C.dim }}>em construção</span>
      <ChevronDown size={12} style={{ color: C.dim }} />
    </button>
  );
}
