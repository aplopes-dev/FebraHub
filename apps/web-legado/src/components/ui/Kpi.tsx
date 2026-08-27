"use client";

import type { ReactNode } from "react";
import { Delta } from "./Delta";
import { Spark, type PontoSpark } from "@/components/graficos/Spark";
import { C, GROTESK, alfaDe } from "@/lib/tema";

export interface KpiProps {
  label: ReactNode;
  valor: ReactNode;
  unidade?: ReactNode;
  delta?: string | null;
  up?: boolean;
  serie?: readonly PontoSpark[] | null;
  nota?: ReactNode;
  destaque?: string;
  /** Mês em curso, já formatado. `null` esconde a linha. */
  parcial?: string | null;
}

export function Kpi({ label, valor, unidade, delta, up, serie, nota, destaque, parcial }: KpiProps) {
  const borda = destaque ? `1px solid ${alfaDe(destaque, 0.27)}` : `1px solid ${C.cardLine}`;
  return (
    <div style={{ background: C.card, border: borda, borderRadius: 15, padding: 18 }}>
      <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, marginBottom: 11 }}>{label}</div>
      <div style={{ fontFamily: GROTESK, fontSize: 26, fontWeight: 700, letterSpacing: "-.5px", color: destaque ?? C.text }}>
        {valor}
        {unidade && <span style={{ fontSize: 15, color: C.muted, fontWeight: 600 }}> {unidade}</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
        <Delta delta={delta} up={up} />
        {serie ? <Spark serie={serie} cor={up ? C.up : C.down} /> : nota && (
          <span style={{ fontSize: 11, color: C.faint }}>{nota}</span>
        )}
      </div>
      {parcial != null && (
        <div style={{ fontSize: 11, color: C.faint, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.hair}` }}>
          Mês em curso: <b style={{ color: C.muted }}>{parcial}</b> (parcial)
        </div>
      )}
    </div>
  );
}
