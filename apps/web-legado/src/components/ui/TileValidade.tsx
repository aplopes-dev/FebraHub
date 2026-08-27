"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { C, GROTESK, alfa, alfaDe } from "@/lib/tema";

// Contador de validade com número colorido — mesma altura do ChipKpi compacto.
export function TileValidade({
  Icone, label, valor, cor, nota,
}: {
  Icone: LucideIcon;
  label: ReactNode;
  valor: ReactNode;
  cor: string;
  nota?: ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, minHeight: 56, background: alfa("sup", 0.03), border: `1px solid ${alfaDe(cor, 0.2)}`, borderRadius: 10, padding: "8px 11px" }}>
      <span style={{ width: 25, height: 25, borderRadius: 7, background: alfaDe(cor, 0.12), color: cor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icone size={13} />
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
          <span style={{ fontFamily: GROTESK, fontSize: 18, fontWeight: 700, color: cor }}>{valor}</span>
          {nota && <span style={{ fontSize: 9.5, color: C.faint }}>{nota}</span>}
        </div>
      </div>
    </div>
  );
}
