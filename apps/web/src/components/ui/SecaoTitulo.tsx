"use client";

import type { ReactNode } from "react";
import { C } from "@/lib/tema";

/* Título de seção — separa blocos temáticos dentro de um hub. */
export function SecaoTitulo({ titulo, canto }: { titulo: ReactNode; canto?: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, margin: "26px 0 14px" }}>
      <h2 style={{ fontSize: 15, fontWeight: 800, color: C.bright }}>{titulo}</h2>
      {canto && <span style={{ fontSize: 11.5, color: C.faint, textAlign: "right" }}>{canto}</span>}
    </div>
  );
}
