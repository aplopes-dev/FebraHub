"use client";

import type { ReactNode } from "react";
import { C, GROTESK, alfa } from "@/lib/tema";

export interface SegmentoDonut {
  rotulo: string;
  valor: number;
  cor: string;
}

/* Donut SVG + legenda. `segmentos`: [{rotulo, valor, cor}]. As % são
   calculadas do total real — nada chumbado. */
export function Donut({
  segmentos, size = 132, centroValor, centroLabel, centroCor, centroSize = 27,
}: {
  segmentos: readonly SegmentoDonut[];
  size?: number;
  centroValor?: ReactNode;
  centroLabel?: ReactNode;
  centroCor?: string;
  centroSize?: number;
}) {
  const total = segmentos.reduce((s, x) => s + x.valor, 0);
  const stroke = 15, r = size / 2 - stroke / 2 - 1, circ = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, flex: 1, minWidth: 0 }}>
      <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
          {/* Cor de SVG sempre por `style`, nunca por atributo: `var(--x)` não
              resolve em atributo de apresentação — a fatia sairia sem pintura. */}
          <circle cx={size / 2} cy={size / 2} r={r} style={{ fill: "none", stroke: alfa("sup", 0.05) }} strokeWidth={stroke} />
          {total > 0 && segmentos.map((s, i) => {
            const dash = (s.valor / total) * circ;
            const c = <circle key={i} cx={size / 2} cy={size / 2} r={r} style={{ fill: "none", stroke: s.cor }}
              strokeWidth={stroke} strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-acc} />;
            acc += dash;
            return c;
          })}
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 12px" }}>
          <div style={{ fontFamily: GROTESK, fontSize: centroSize, fontWeight: 700, color: centroCor ?? C.gold, lineHeight: 1, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center" }}>{centroValor}</div>
          <div style={{ fontSize: 10.5, color: C.muted, fontWeight: 600, marginTop: 3, textAlign: "center", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{centroLabel}</div>
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 11, minWidth: 0 }}>
        {segmentos.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: s.cor, flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, color: "var(--icone)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.rotulo}</span>
            <span style={{ fontFamily: GROTESK, fontSize: 13, fontWeight: 700, color: C.text }}>{total > 0 ? Math.round((s.valor / total) * 100) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
