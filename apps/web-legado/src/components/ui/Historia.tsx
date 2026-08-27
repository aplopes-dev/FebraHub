"use client";

import type { ReactNode } from "react";
import { AlertTriangle, Sparkles } from "lucide-react";
import { C, SOBRE_OURO, alfa } from "@/lib/tema";

/* Faixa narrativa. No mockup ela diz "gerado pela IA" — não existe
   IA aqui ainda, e prometer isso queima a confiança no painel.
   O texto abaixo é CALCULADO a partir dos números reais. Quando o
   motor de atribuição existir, troca-se a fonte, não o layout. */
export function Historia({ frases, cobertura }: { frases: ReactNode; cobertura?: ReactNode }) {
  return (
    <div style={{
      position: "relative", border: `1px solid ${alfa("gold", 0.22)}`, borderRadius: 18,
      padding: "26px 28px", marginBottom: 26, overflow: "hidden",
      background: `linear-gradient(120deg, ${alfa("gold", 0.09)}, ${alfa("gold", 0.02)} 42%, ${alfa("sup", 0.015)})`,
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: `linear-gradient(${C.goldTop}, ${C.goldBase})` }} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{
          width: 22, height: 22, borderRadius: 6, background: `linear-gradient(180deg, ${C.goldTop}, ${C.goldBase})`, color: SOBRE_OURO,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Sparkles size={12} />
        </span>
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase", color: C.gold }}>
          O mês em uma frase
        </span>
        <span style={{ fontSize: 11, color: C.faint, marginLeft: 4 }}>calculado sobre os dados do banco</span>
      </div>
      <p style={{ fontSize: 18.5, lineHeight: 1.62, fontWeight: 500, color: C.bright, maxWidth: 960 }}>
        {frases}
      </p>
      {cobertura && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 18, paddingTop: 16, borderTop: `1px solid ${alfa("gold", 0.13)}` }}>
          <AlertTriangle size={13} style={{ color: C.warn, marginTop: 2, flexShrink: 0 }} />
          <span style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.55 }}>{cobertura}</span>
        </div>
      )}
    </div>
  );
}
