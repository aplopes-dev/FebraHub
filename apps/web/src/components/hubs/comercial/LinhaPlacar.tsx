"use client";

import type { LucideIcon } from "lucide-react";
import { Frown, Gift, Meh, Smile } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { C, GROTESK } from "@/lib/tema";

export interface LinhaCarinhas {
  consultor_id?: string | null;
  consultora?: string | null;
  foto_url?: string | null;
  verdes: number;
  amarelas: number;
  vermelhas: number;
  presentes: number;
  faltam: number;
}

/* Linha do placar. As verdes rendem brinde a cada 10; a barra mede só o
   progresso pro próximo. Vermelha é contador puro — sem punição visível. */
export function LinhaPlacar({ p, onVerdes }: { p: LinhaCarinhas; onVerdes?: () => void }) {
  const MAX_CHIPS = 5;
  const contagem = (Icone: LucideIcon, cor: string, n: number, titulo: string, onClick?: () => void) => {
    const clicavel = !!onClick && n > 0;
    return (
      <span
        onClick={clicavel ? onClick : undefined}
        title={clicavel ? "Ver as vendas verdes (auditável)" : titulo}
        style={{
          display: "flex", alignItems: "center", gap: 4,
          cursor: clicavel ? "pointer" : "default",
          borderBottom: clicavel ? `1px dotted ${cor}` : "1px dotted transparent",
        }}
      >
        <Icone size={13} style={{ color: cor }} />
        <b style={{ fontFamily: GROTESK, fontSize: 13, color: n > 0 ? C.text : C.dim }}>{n}</b>
      </span>
    );
  };

  return (
    <div style={{ padding: "7px 14px", borderBottom: `1px solid ${C.hair}`, display: "flex", alignItems: "center", gap: 10 }}>
      <Avatar url={p.foto_url} nome={p.consultora} tam={30} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.bright, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {p.consultora}
          </span>
          {/* Um chip por presente. O "?" é o prêmio — brinde surpresa. */}
          {p.presentes > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
              {Array.from({ length: Math.min(p.presentes, MAX_CHIPS) }).map((_, i) => (
                <span key={i} title="Brinde surpresa" style={{
                  display: "flex", alignItems: "center", gap: 2, fontSize: 10, fontWeight: 800,
                  color: "#100c04", background: `linear-gradient(150deg, ${C.goldTop}, ${C.goldBase})`,
                  border: `1px solid ${C.goldTop}`, padding: "1px 5px", borderRadius: 5, flexShrink: 0,
                }}>
                  <Gift size={11} /> ?
                </span>
              ))}
              {p.presentes > MAX_CHIPS && (
                <b style={{ fontSize: 10.5, fontWeight: 800, color: C.gold }}>×{p.presentes}</b>
              )}
            </span>
          )}
        </div>

        <div style={{ height: 3, borderRadius: 3, background: "rgba(255,255,255,.06)", overflow: "hidden", marginTop: 6, maxWidth: 300 }}>
          <div style={{
            width: `${((p.verdes % 10) / 10) * 100}%`, height: "100%", borderRadius: 3,
            background: `linear-gradient(90deg, ${C.up}99, ${C.up})`,
          }} />
        </div>
        <div style={{ fontSize: 10, color: C.faint, marginTop: 4, display: "inline-flex", alignItems: "center", gap: 4 }}>
          faltam <b style={{ color: C.muted }}>{p.faltam}</b> pro próximo
          <Gift size={10} style={{ color: C.gold }} />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        {contagem(Smile, C.up, p.verdes, "Verde — venda 100% Pix, transferência ou dinheiro", onVerdes)}
        {contagem(Meh, C.warn, p.amarelas, "Amarela — venda mista (parte Pix, parte cartão)")}
        {contagem(Frown, C.down, p.vermelhas, "Vermelha — venda 100% Stone")}
      </div>
    </div>
  );
}
