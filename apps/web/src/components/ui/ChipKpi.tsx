"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { C, GROTESK, alfa } from "@/lib/tema";

export interface ChipKpiProps {
  Icone: LucideIcon;
  label: ReactNode;
  valor: ReactNode;
  unidade?: ReactNode;
  delta?: string | null;
  up?: boolean;
  nota?: ReactNode;
  /** Deixa o card dourado (o número-âncora da faixa). */
  hero?: boolean;
  compacto?: boolean;
  /** Linha secundária opcional (ex.: líquido abaixo do bruto). */
  sub?: ReactNode;
}

/* Chip de KPI compacto — faixa horizontal do design: ícone + label +
   valor + delta/nota. `hero` deixa o card dourado (o número-âncora). */
export function ChipKpi({ Icone, label, valor, unidade, delta, up, nota, hero, compacto, sub }: ChipKpiProps) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: compacto ? 9 : 12, minHeight: compacto ? 56 : 78,
      background: alfa("sup", 0.03),
      border: `1px solid ${hero ? alfa("gold", 0.22) : C.cardLine}`,
      borderRadius: compacto ? 10 : 13, padding: compacto ? "8px 11px" : "13px 15px",
    }}>
      <span style={{
        width: compacto ? 25 : 30, height: compacto ? 25 : 30, flexShrink: 0, borderRadius: compacto ? 7 : 8,
        background: hero ? alfa("gold", 0.14) : alfa("sup", 0.05),
        color: hero ? C.gold : "var(--icone)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icone size={compacto ? 13 : 15} />
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: compacto ? 10 : 11, color: C.muted, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: compacto ? 5 : 7, flexWrap: "wrap" }}>
          <span style={{ fontFamily: GROTESK, fontSize: compacto ? 18 : 22, fontWeight: 700, letterSpacing: "-.5px", color: hero ? C.gold : C.text }}>
            {valor}
            {unidade && <span style={{ fontSize: compacto ? 11 : 12, color: C.muted, fontWeight: 600 }}> {unidade}</span>}
          </span>
          {delta != null
            ? <span style={{ fontSize: compacto ? 10 : 11, fontWeight: 800, color: up ? C.up : C.down }}>{up ? "▲" : "▼"} {String(delta).replace(/[+-]/, "")}</span>
            : nota && <span style={{ fontSize: compacto ? 9.5 : 11, fontWeight: 800, color: C.muted }}>{nota}</span>}
        </div>
        {/* Linha secundária opcional (ex.: líquido abaixo do bruto). Sem
            `sub`, o chip renderiza igual a antes. */}
        {sub && <div style={{ fontSize: compacto ? 9.5 : 10.5, color: C.faint, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</div>}
      </div>
    </div>
  );
}
