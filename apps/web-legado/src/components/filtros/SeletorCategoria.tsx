"use client";

import { useCategoria } from "@/lib/periodo";
import { rotuloCat } from "@/lib/dados";
import { C, SANS, alfa } from "@/lib/tema";

/* Seletor de categoria — ao lado dos filtros de período. Só aparece no
   Hub Comercial, único lugar onde a categoria recorta algo. */
export function SeletorCategoria() {
  const { categoria, setCategoria, categorias } = useCategoria();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: ".5px" }}>
        Categoria
      </span>
      <div style={{ display: "flex", gap: 2, background: alfa("sup", 0.04), border: `1px solid ${C.cardLine}`, borderRadius: 10, padding: 3 }}>
        {categorias.map((c) => {
          const ativo = c === categoria;
          return (
            <button key={c} onClick={() => setCategoria(c)} aria-pressed={ativo} style={{
              fontFamily: SANS, fontSize: 11.5, fontWeight: 700, padding: "6px 11px",
              borderRadius: 7, border: "none", cursor: "pointer", whiteSpace: "nowrap",
              background: ativo ? alfa("gold", 0.12) : "transparent",
              color: ativo ? C.gold : C.muted,
            }}>
              {rotuloCat(c)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
