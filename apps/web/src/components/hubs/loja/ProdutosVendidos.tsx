"use client";

import { C, GROTESK, alfa } from "@/lib/tema";
import { moeda, numero } from "@/lib/formato";
import type { ProdutoVendido } from "./calculos";

/* Ranking de produtos: nome + quantidade + faturamento, barra pelo valor.
   Duas grandezas por linha, então não cabe no `Lista` genérico. */
export function ProdutosVendidos({ linhas }: { linhas: readonly ProdutoVendido[] }) {
  const max = Math.max(...linhas.map((l) => l.faturamento), 1);
  return (
    <div>
      {linhas.map((l, i) => (
        <div key={l.produto} style={{ padding: "9px 20px", borderBottom: `1px solid ${C.hair}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
            <span style={{ display: "flex", alignItems: "baseline", gap: 8, minWidth: 0 }}>
              <span style={{ fontFamily: GROTESK, fontSize: 11, fontWeight: 700, color: i === 0 ? C.gold : C.faint, flexShrink: 0, width: 16 }}>{i + 1}</span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: C.bright, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={l.produto}>{l.produto}</span>
            </span>
            <span style={{ display: "flex", alignItems: "baseline", gap: 8, flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: C.faint }}>{numero(l.quantidade)} un</span>
              <span style={{ fontFamily: GROTESK, fontSize: 13.5, fontWeight: 700, color: i === 0 ? C.gold : C.text }}>{moeda(l.faturamento)}</span>
            </span>
          </div>
          <div style={{ height: 5, borderRadius: 3, background: alfa("sup", 0.06), overflow: "hidden" }}>
            <div style={{ width: `${(l.faturamento / max) * 100}%`, height: "100%", borderRadius: 3, background: i === 0 ? `linear-gradient(90deg, ${C.goldTop}, ${C.goldBase})` : `linear-gradient(90deg, ${C.goldBase}, ${C.gold})` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
