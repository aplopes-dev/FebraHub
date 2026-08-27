"use client";

import type { ReactNode } from "react";
import { Database, Loader2, ShieldAlert } from "lucide-react";
import { C } from "@/lib/tema";

export interface EstadoProps {
  carregando?: boolean;
  erro?: Error | null;
  vazio?: boolean;
  children?: ReactNode;
  vazioTitulo?: string;
  vazioDica?: ReactNode;
}

/** Carregando / erro / vazio, nesta ordem. O estado vazio é CONTEXTUAL: quem
 *  chama passa o título e a dica com as datas do recorte, porque "sem dados"
 *  sem motivo lê como erro. */
export function Estado({ carregando, erro, vazio, children, vazioTitulo, vazioDica }: EstadoProps) {
  if (carregando)
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 9, justifyContent: "center", padding: "56px 0" }}>
        <Loader2 size={16} className="girar" style={{ color: C.goldBase }} />
        <span style={{ fontSize: 13, color: C.faint }}>Carregando</span>
      </div>
    );
  if (erro)
    return (
      <div style={{ display: "flex", gap: 11, padding: "28px 0" }}>
        <ShieldAlert size={16} style={{ color: C.down, marginTop: 2 }} />
        <div>
          <div style={{ fontSize: 13.5, color: C.bright, fontWeight: 600 }}>Não foi possível carregar</div>
          <div style={{ fontSize: 12, color: C.faint, marginTop: 4 }}>{erro.message}</div>
        </div>
      </div>
    );
  if (vazio)
    return (
      <div style={{ display: "flex", gap: 11, padding: "28px 0" }}>
        <Database size={16} style={{ color: C.faint, marginTop: 2 }} />
        <div>
          <div style={{ fontSize: 13.5, color: C.muted, fontWeight: 600 }}>{vazioTitulo ?? "Sem dados neste recorte"}</div>
          <div style={{ fontSize: 12, color: C.faint, marginTop: 4, lineHeight: 1.5 }}>
            {vazioDica ?? "Ou a fonte não foi conectada, ou seu perfil não tem acesso a este setor."}
          </div>
        </div>
      </div>
    );
  return <>{children}</>;
}
