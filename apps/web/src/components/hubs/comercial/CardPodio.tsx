"use client";

import type { ReactNode } from "react";
import { Crown } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { C, GROTESK, SOBRE_OURO, alfa } from "@/lib/tema";
import { moeda, numero } from "@/lib/formato";

export interface ItemPodio {
  consultor_id?: string | null;
  consultora?: string | null;
  foto_url?: string | null;
  /** false = ex-consultora: sem foto, marcado discreto. */
  atual?: boolean | null;
  receita: number;
  vendas?: number;
  ticket_medio?: number;
  /** Só o Sympla usa (eventos/ingressos). Sem ela, o texto de vendas/ticket
   *  segue idêntico. */
  sub?: ReactNode;
}

/* Card do pódio. O 1º lugar ganha moldura dourada, coroa e número maior —
   a Beatriz está muito à frente e o card precisa dizer isso de relance. */
export function CardPodio({ c, pos }: { c: ItemPodio; pos: number }) {
  const primeiro = pos === 1;
  const ex = c.atual === false; // ex-consultor: sem foto, marcado discreto
  return (
    <div style={{
      background: primeiro ? `linear-gradient(150deg, ${alfa("gold", 0.08)}, ${alfa("sup", 0.02)})` : C.card,
      border: `1px solid ${primeiro ? alfa("gold", 0.33) : C.cardLine}`,
      borderRadius: 12, padding: "12px 8px",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 5, textAlign: "center",
      opacity: ex ? 0.78 : 1,
    }}>
      {primeiro && <Crown size={13} style={{ color: C.gold }} />}
      <div style={{ position: "relative", lineHeight: 0 }}>
        <Avatar url={ex ? null : c.foto_url} nome={c.consultora} tam={primeiro ? 58 : 46} />
        <span style={{
          position: "absolute", bottom: -2, right: -2, minWidth: 18, height: 18, padding: "0 4px",
          borderRadius: 9, fontSize: 9.5, fontWeight: 800, fontFamily: GROTESK,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: primeiro ? `linear-gradient(150deg, ${C.goldTop}, ${C.goldBase})` : "var(--badge-fundo)",
          color: primeiro ? SOBRE_OURO : C.muted,
          border: `1px solid ${primeiro ? C.goldTop : C.cardLine}`,
        }}>
          {pos}º
        </span>
      </div>
      <div style={{ fontSize: primeiro ? 12.5 : 11.5, fontWeight: 700, color: ex ? C.muted : C.bright, lineHeight: 1.25 }}>
        {c.consultora}
      </div>
      {ex && (
        <span style={{
          fontSize: 8.5, fontWeight: 800, letterSpacing: ".4px", textTransform: "uppercase",
          color: C.dim, border: `1px solid ${C.cardLine}`, borderRadius: 4, padding: "0 4px",
        }}>
          ex-consultora
        </span>
      )}
      <div style={{
        fontFamily: GROTESK, fontSize: primeiro ? 19 : 16, fontWeight: 700,
        letterSpacing: "-.5px", color: ex ? C.muted : (primeiro ? C.gold : C.text),
      }}>
        {moeda(c.receita)}
      </div>
      {/* `sub` só é usado pelo Sympla (eventos/ingressos). Sem ela, o
          texto original de vendas/ticket segue idêntico. */}
      <div style={{ fontSize: 9.5, color: C.faint, lineHeight: 1.3 }}>
        {c.sub ?? <>{numero(c.vendas)} vendas · ticket {moeda(c.ticket_medio)}</>}
      </div>
    </div>
  );
}
