"use client";

import { C, CORES_FONTE, alfa } from "@/lib/tema";
import { moeda } from "@/lib/formato";

export interface FonteReceita {
  fonte: string;
  valor: number;
  pct: number;
}

/* Quebra da receita por fonte — barra 100% empilhada + legenda com %. Detalhe
   do card de receita: Produtos domina (~91%); as outras são complementos
   (livrão, cursos premium, aluguel de sala, Sentido de Brincar). */
export function FonteBreakdown({ fontes }: { fontes: readonly FonteReceita[] }) {
  const total = fontes.reduce((s, f) => s + f.valor, 0);
  if (!total) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <div style={{ display: "flex", height: 9, borderRadius: 5, overflow: "hidden", background: alfa("sup", 0.05) }}>
        {fontes.map((f, i) => (
          <div key={f.fonte} title={`${f.fonte} · ${moeda(f.valor)} · ${f.pct.toFixed(0)}%`}
            style={{ width: `${f.pct}%`, background: CORES_FONTE[i % CORES_FONTE.length] }} />
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "3px 12px", fontSize: 10.5, color: C.faint }}>
        {fontes.map((f, i) => (
          <span key={f.fonte} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: 2, background: CORES_FONTE[i % CORES_FONTE.length], flexShrink: 0 }} />
            <b style={{ color: C.muted, fontWeight: 700 }}>{f.fonte}</b>
            <span style={{ color: C.dim }}>{f.pct.toFixed(0)}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}
