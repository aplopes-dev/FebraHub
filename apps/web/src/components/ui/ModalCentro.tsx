"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { C } from "@/lib/tema";

// Modal centralizado (backdrop fecha ao clicar fora).
export function ModalCentro({
  titulo, onFechar, children, largura = 560,
}: {
  titulo: ReactNode;
  onFechar: () => void;
  children: ReactNode;
  largura?: number;
}) {
  return (
    <>
      <div onClick={onFechar} style={{ position: "fixed", inset: 0, zIndex: 60, background: "var(--veu-modal)" }} />
      <div className="rolagem" style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 61,
        width: `min(${largura}px, 94vw)`, maxHeight: "88vh", overflowY: "auto",
        background: "var(--modal-fundo)", border: `1px solid ${C.cardLine}`, borderRadius: 16, boxShadow: "var(--sombra-modal)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: `1px solid ${C.hair}`, position: "sticky", top: 0, background: "var(--modal-fundo)", zIndex: 1 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: C.bright }}>{titulo}</span>
          <button onClick={onFechar} aria-label="Fechar" style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", display: "flex" }}><X size={18} /></button>
        </div>
        <div style={{ padding: 18 }}>{children}</div>
      </div>
    </>
  );
}
