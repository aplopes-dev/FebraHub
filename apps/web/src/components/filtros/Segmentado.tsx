"use client";

import { C, SANS } from "@/lib/tema";

export interface OpcaoSegmento<T> {
  key: T;
  label: string;
}

/* Barra segmentada genérica, no mesmo desenho do seletor de período. */
export function Segmentado<T>({
  opcoes, valor, onChange, label,
}: {
  opcoes: readonly OpcaoSegmento<T>[];
  valor: T;
  onChange: (k: T) => void;
  label?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      {label && (
        <span style={{ fontSize: 10, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: ".5px" }}>
          {label}
        </span>
      )}
      <div style={{ display: "flex", gap: 2, background: "rgba(255,255,255,.04)", border: `1px solid ${C.cardLine}`, borderRadius: 10, padding: 3 }}>
        {opcoes.map((o) => {
          const ativo = o.key === valor;
          return (
            <button key={String(o.key)} onClick={() => onChange(o.key)} aria-pressed={ativo} style={{
              fontFamily: SANS, fontSize: 11, fontWeight: 700, padding: "5px 9px",
              borderRadius: 7, border: "none", cursor: "pointer", whiteSpace: "nowrap",
              background: ativo ? `${C.gold}1F` : "transparent",
              color: ativo ? C.gold : C.muted,
            }}>
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
