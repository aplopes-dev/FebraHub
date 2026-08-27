"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { C, SANS } from "@/lib/tema";

/**
 * DrawerLateral — casca única do painel deslizante da direita.
 *
 * Antes cada tela reimplementava isto à mão: overlay `position:fixed inset:0`,
 * painel deslizante, botão de fechar e um `useEffect` de Escape próprios
 * (FormCrud, DrawerCliente, DrawerNegocio, DrawerEmpresa…). Agora é um só:
 * backdrop fecha ao clicar fora, Esc fecha, e o header/scroll são padronizados.
 *
 * O corpo (`children`) fica num container rolável; use `rodape` para a barra de
 * ações fixa embaixo (Cancelar/Salvar). Para um form, envolva com <form> por
 * fora e passe o conteúdo como children — ou use o FormCrud, que já faz isso.
 */
export function DrawerLateral({
  titulo,
  aoFechar,
  children,
  rodape,
  largura = 440,
  fecharAoClicarFora = true,
}: {
  titulo: ReactNode;
  aoFechar: () => void;
  children: ReactNode;
  /** Barra de ações fixa no rodapé (ex.: Cancelar / Salvar). */
  rodape?: ReactNode;
  largura?: number;
  fecharAoClicarFora?: boolean;
}) {
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoFechar();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aoFechar]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={typeof titulo === "string" ? titulo : undefined}
      onClick={fecharAoClicarFora ? aoFechar : undefined}
      style={{
        position: "fixed", inset: 0, zIndex: 80,
        background: "var(--veu-modal, rgba(0,0,0,.45))",
        display: "flex", justifyContent: "flex-end",
      }}
    >
      <aside
        onClick={(e) => e.stopPropagation()}
        style={{
          width: `min(${largura}px, 100%)`, height: "100%",
          background: C.modalFundo, borderLeft: `1px solid ${C.cardLine}`,
          display: "flex", flexDirection: "column",
          boxShadow: "-12px 0 40px rgba(0,0,0,.25)",
        }}
      >
        <header style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 18px", borderBottom: `1px solid ${C.cardLine}`, flexShrink: 0,
        }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, fontFamily: SANS, color: C.bright }}>{titulo}</h2>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            style={{ background: "none", border: "none", cursor: "pointer", color: C.faint, padding: 4, display: "flex" }}
          >
            <X size={18} />
          </button>
        </header>

        <div className="rolagem" style={{ flex: 1, overflow: "auto", padding: 18 }}>{children}</div>

        {rodape && (
          <footer style={{
            padding: 16, borderTop: `1px solid ${C.cardLine}`, flexShrink: 0,
            display: "flex", justifyContent: "flex-end", gap: 8,
          }}>
            {rodape}
          </footer>
        )}
      </aside>
    </div>
  );
}
