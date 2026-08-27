"use client";

import { Loader2 } from "lucide-react";
import { C } from "@/lib/tema";

/** Tela de espera enquanto a sessão é resolvida. Mesma do protótipo: só o
 *  spinner dourado sobre o fundo, sem esqueleto — o app abre em menos de um
 *  segundo e um skeleton piscaria. */
export function TelaCarregando() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.void }}>
      <Loader2 size={18} className="girar" style={{ color: C.goldBase }} />
    </div>
  );
}
