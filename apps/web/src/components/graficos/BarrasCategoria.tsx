"use client";

import { AlertTriangle } from "lucide-react";
import { C, GROTESK } from "@/lib/tema";
import { moeda } from "@/lib/formato";

export interface LinhaCategoria {
  categoria: string;
  vendas: number;
  bruto: number;
  unidade: number;
  repasse: number;
  orfa: boolean;
}

/* Receita por categoria — barras horizontais do design. Ranqueada pela
   receita da UNIDADE (o que fica na Febracis), nunca pelo bruto. No
   Coaching o bruto se divide 50/50: a metade da unidade é sólida, a do
   coach é hachurada (aparece, mas não conta como receita da casa).
   "Sem vínculo" fica por último, cinza — é cobertura, não produto. */
export function BarrasCategoria({
  reais, orfas, semVinc, cobertura,
}: {
  reais: readonly LinhaCategoria[];
  orfas: readonly LinhaCategoria[];
  semVinc: number;
  cobertura: number | null;
}) {
  const max = Math.max(...reais.map((r) => r.unidade), 1);
  const barra = (r: LinhaCategoria, i: number) => (
    <div key={r.categoria}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: r.orfa ? C.faint : C.bright, fontStyle: r.orfa ? "italic" : "normal", display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.categoria}>{r.categoria}</span>
          {r.repasse > 0 && (
            <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: ".4px", color: C.warn, background: `${C.warn}24`, border: `1px solid ${C.warn}4d`, padding: "1px 6px", borderRadius: 5, flexShrink: 0 }}>50/50</span>
          )}
        </span>
        <span style={{ fontFamily: GROTESK, fontSize: 13, fontWeight: 700, flexShrink: 0, color: r.orfa ? C.faint : (i === 0 ? C.gold : C.text) }}>{moeda(r.unidade)}</span>
      </div>
      <div style={{ height: 8, borderRadius: 5, background: "rgba(255,255,255,.05)", overflow: "hidden", display: "flex" }}>
        <div style={{
          width: `${(r.unidade / max) * 100}%`, height: "100%", borderRadius: 5,
          background: r.orfa ? C.faint : (i === 0 ? `linear-gradient(90deg, ${C.goldTop}, ${C.goldBase})` : "linear-gradient(90deg, #d9b866, #7d6634)"),
        }} />
        {r.repasse > 0 && (
          <div style={{ width: `${(r.repasse / max) * 100}%`, height: "100%", background: `repeating-linear-gradient(45deg, ${C.gold}38 0 3px, transparent 3px 6px)` }} />
        )}
      </div>
      {r.repasse > 0 && <div style={{ fontSize: 10, color: C.faint, marginTop: 4 }}>bruto {moeda(r.bruto)} · 50% repassado ao coach ({moeda(r.repasse)})</div>}
      {r.orfa && <div style={{ fontSize: 10, color: C.faint, marginTop: 4 }}>pagamento sem matrícula casada — não é um produto</div>}
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
      {reais.map(barra)}
      {orfas.map((o, i) => barra(o, reais.length + i))}
      <div style={{ display: "flex", gap: 8, paddingTop: 10, borderTop: `1px solid ${C.hair}` }}>
        <AlertTriangle size={12} style={{ color: C.warn, marginTop: 2, flexShrink: 0 }} />
        <span style={{ fontSize: 10.5, color: C.faint, lineHeight: 1.5 }}>
          Ranqueado pela receita da unidade — o que fica na Febracis, não o bruto.
          {semVinc > 0 && <> “Sem vínculo” ({moeda(semVinc)}) fora do ranking de produtos.</>}
          {cobertura != null && <> Cobertura: {cobertura.toFixed(0)}% da receita com categoria identificada.</>}
        </span>
      </div>
    </div>
  );
}
