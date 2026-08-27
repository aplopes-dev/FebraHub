"use client";

import type { ReactNode } from "react";
import { C } from "@/lib/tema";

export interface BlocoProps {
  titulo: ReactNode;
  canto?: ReactNode;
  children: ReactNode;
  /** Sem padding interno — pra listas que desenham a própria borda. */
  sem?: boolean;
  altura?: number;
}

/* Painel. Com `altura`, o cabeçalho fica fixo e só o CORPO rola
   (overflow-y interno) — o card nunca passa da altura, então a página
   não cresce. Sem `altura`, cresce com o conteúdo (comportamento antigo). */
export function Bloco({ titulo, canto, children, sem, altura }: BlocoProps) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.cardLine}`, borderRadius: 16,
      overflow: "hidden", marginBottom: 14,
      display: "flex", flexDirection: "column", minHeight: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 20px", borderBottom: `1px solid ${C.hair}`, flexShrink: 0 }}>
        <span style={{ fontSize: 13.5, fontWeight: 800, color: C.bright }}>{titulo}</span>
        {canto && <span style={{ fontSize: 11, color: C.faint }}>{canto}</span>}
      </div>
      <div
        className={altura ? "rolagem" : undefined}
        style={{
          padding: sem ? 0 : "16px 20px",
          ...(altura ? { maxHeight: altura, overflowY: "auto" as const } : {}),
        }}
      >
        {children}
      </div>
    </div>
  );
}
