"use client";

import { C, SANS } from "@/lib/tema";

/* Alterna entre o top-N e a lista inteira. Ranking longo empurraria os
   outros cards pra fora da primeira tela — a Dulce vê os 5 que importam
   e abre o resto só se precisar. */
export function VerTodas({ aberto, resto, onClick }: { aberto: boolean; resto: number; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      width: "100%", padding: "9px 20px", textAlign: "center", background: "none",
      border: "none", borderBottom: `1px solid ${C.hair}`, cursor: "pointer",
      fontFamily: SANS, fontSize: 11.5, fontWeight: 700, letterSpacing: ".3px", color: C.gold,
    }}>
      {aberto ? "Ver menos ▴" : `Ver todas · +${resto} ▾`}
    </button>
  );
}
