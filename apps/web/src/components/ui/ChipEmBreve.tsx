"use client";

import type { LucideIcon } from "lucide-react";
import { C, GROTESK } from "@/lib/tema";

/* KPI que ainda não tem fonte. Fica desenhado, esmaecido e com o motivo:
   escondê-lo apagaria a lacuna, e preenchê-lo seria inventar. */
export function ChipEmBreve({ Icone, label, nota }: { Icone: LucideIcon; label: string; nota?: string }) {
  return (
    <div title={nota} style={{
      display: "flex", alignItems: "center", gap: 9, minHeight: 56,
      background: "rgba(255,255,255,.015)", border: `1px dashed ${C.cardLine}`,
      borderRadius: 10, padding: "8px 11px",
    }}>
      <span style={{
        width: 25, height: 25, flexShrink: 0, borderRadius: 7, background: "rgba(255,255,255,.04)",
        color: C.dim, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icone size={13} />
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 10, color: C.faint, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
        <div style={{ fontFamily: GROTESK, fontSize: 14.5, fontWeight: 700, color: C.dim, letterSpacing: "-.3px" }}>em construção</div>
        {nota && <div style={{ fontSize: 9.5, color: C.dim, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nota}</div>}
      </div>
    </div>
  );
}
