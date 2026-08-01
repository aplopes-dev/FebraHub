"use client";

import { C, GROTESK } from "@/lib/tema";
import { moeda, numero } from "@/lib/formato";

export interface LinhaCanal {
  canal: string;
  vendas: number;
  valor: number;
}

/* Origem das vendas por canal. Duas grandezas por linha (quantas vendas e
   quanto), então não cabe no `Lista` — a barra é pelo valor. */
export function CanaisVenda({ linhas }: { linhas: readonly LinhaCanal[] }) {
  const max = Math.max(...linhas.map((l) => l.valor), 1);
  return (
    <div>
      {linhas.map((l) => (
        <div key={l.canal} style={{ padding: "9px 20px", borderBottom: `1px solid ${C.hair}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: C.bright, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={l.canal}>{l.canal}</span>
            <span style={{ display: "flex", alignItems: "baseline", gap: 8, flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: C.faint }}>{numero(l.vendas)} {l.vendas === 1 ? "venda" : "vendas"}</span>
              <span style={{ fontFamily: GROTESK, fontSize: 13.5, fontWeight: 700, color: C.text }}>{moeda(l.valor)}</span>
            </span>
          </div>
          <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,.06)", overflow: "hidden" }}>
            <div style={{ width: `${(l.valor / max) * 100}%`, height: "100%", borderRadius: 3, background: `linear-gradient(90deg, ${C.goldBase}, ${C.gold})` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
