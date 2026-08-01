"use client";

import { SeletorAno } from "./SeletorAno";
import { SeletorMes } from "./SeletorMes";
import { usePeriodo } from "@/lib/periodo";
import { PERIODOS } from "@/lib/dados";
import { C, SANS } from "@/lib/tema";

/* Seletor de período — no topo, ao lado do sino. */
export function SeletorPeriodo() {
  const { modo, escolherModo } = usePeriodo();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      {modo === "ano" && <SeletorAno />}
      {modo === "mes" && <SeletorMes />}
      {modo === "7d" && <span style={{ fontSize: 12, fontWeight: 700, color: C.gold, whiteSpace: "nowrap" }}>Últimos 7 dias</span>}
      {modo === "hoje" && <span style={{ fontSize: 12, fontWeight: 700, color: C.gold, whiteSpace: "nowrap" }}>Hoje</span>}
      <div style={{ display: "flex", gap: 2, background: "rgba(255,255,255,.04)", border: `1px solid ${C.cardLine}`, borderRadius: 10, padding: 3 }}>
        {PERIODOS.map((p) => {
          const ativo = p.key === modo;
          return (
            <button
              key={p.key}
              onClick={() => escolherModo(p.key)}
              aria-pressed={ativo}
              style={{
                fontFamily: SANS, fontSize: 11.5, fontWeight: 700, padding: "6px 11px",
                borderRadius: 7, border: "none", cursor: "pointer",
                background: ativo ? `${C.gold}1F` : "transparent",
                color: ativo ? C.gold : C.muted,
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
