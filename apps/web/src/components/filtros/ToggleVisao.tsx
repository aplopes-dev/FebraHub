"use client";

import { C, SANS } from "@/lib/tema";

export type VisaoPodio = "periodo" | "geral";

/* Alterna a fonte do pódio: recorte do filtro global x hall da fama. */
export function ToggleVisao({ valor, onChange }: { valor: VisaoPodio; onChange: (v: VisaoPodio) => void }) {
  return (
    <span style={{ display: "flex", gap: 2, background: "rgba(255,255,255,.04)", border: `1px solid ${C.cardLine}`, borderRadius: 9, padding: 2, flexShrink: 0 }}>
      {([{ key: "periodo", label: "Período" }, { key: "geral", label: "Geral" }] as const).map((o) => {
        const ativo = o.key === valor;
        return (
          <button key={o.key} onClick={() => onChange(o.key)} aria-pressed={ativo} style={{
            fontFamily: SANS, fontSize: 11, fontWeight: 700, padding: "4px 10px",
            borderRadius: 7, border: "none", cursor: "pointer",
            background: ativo ? `${C.gold}1F` : "transparent",
            color: ativo ? C.gold : C.muted,
          }}>
            {o.label}
          </button>
        );
      })}
    </span>
  );
}
