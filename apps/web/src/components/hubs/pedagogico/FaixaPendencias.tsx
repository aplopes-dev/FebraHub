"use client";

import { AlertTriangle } from "lucide-react";
import { C, SANS } from "@/lib/tema";
import { emNDias } from "@/lib/dados";
import type { TurmaPainel } from "@/types/views";

// Pendência urgente (CRIAR GRUPO — URGENTE) em vermelho; as demais em dourado.
export const corPendencia = (p: unknown): string => (/URGENTE/i.test(String(p ?? "")) ? C.down : C.gold);

// Faixa de pendências no topo do hub — cards clicáveis. Só renderiza se houver.
export function FaixaPendencias({
  pendencias, onAbrir,
}: {
  pendencias: readonly TurmaPainel[];
  onAbrir: (t: TurmaPainel) => void;
}) {
  if (!pendencias.length) return null;
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
      {pendencias.map((t) => {
        const cor = corPendencia(t.pendencia);
        return (
          <button key={t.turma_id} onClick={() => onAbrir(t)} style={{
            display: "flex", alignItems: "center", gap: 9, textAlign: "left", cursor: "pointer",
            background: `${cor}12`, border: `1px solid ${cor}44`, borderRadius: 12, padding: "10px 13px",
            color: C.text, fontFamily: SANS, minWidth: 220, flex: "1 1 220px", maxWidth: 340,
          }}>
            <AlertTriangle size={16} style={{ color: cor, flexShrink: 0 }} />
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 9.5, fontWeight: 800, letterSpacing: ".3px", textTransform: "uppercase", color: cor }}>{t.pendencia}</span>
              <span style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: C.bright, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={t.curso ?? ""}>{t.curso}</span>
              <span style={{ display: "block", fontSize: 10.5, color: C.faint }}>{emNDias(t.dias_para_inicio)}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
