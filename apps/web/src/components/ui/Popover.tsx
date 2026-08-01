"use client";

import type { ReactNode } from "react";
import { C } from "@/lib/tema";

/* Popover ancorado — o pai precisa ser position:relative. O backdrop fixo
   captura o clique fora pra fechar. */
export function Popover({
  aberto, onFechar, children, largura = 150,
}: {
  aberto: boolean;
  onFechar: () => void;
  children: ReactNode;
  largura?: number;
}) {
  if (!aberto) return null;
  return (
    <>
      <div onClick={onFechar} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
      <div className="rolagem" style={{
        position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 41,
        background: "var(--pop-fundo)", border: `1px solid ${C.cardLine}`, borderRadius: 10,
        padding: 4, minWidth: largura, maxHeight: 264, overflowY: "auto",
        boxShadow: "var(--sombra-popover)",
      }}>
        {children}
      </div>
    </>
  );
}
