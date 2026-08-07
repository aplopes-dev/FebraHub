"use client";

import { useState } from "react";
import { VerTodas } from "./VerTodas";
import { C, GROTESK, alfa } from "@/lib/tema";
import { moeda } from "@/lib/formato";
import type { LinhaRotulada } from "@/lib/dados";

export interface ListaProps {
  linhas: readonly LinhaRotulada[];
  formatar?: (v: number) => string;
  total?: number | null;
  /** Mostra só os N primeiros e esconde o resto atrás do "ver todas". */
  top?: number;
}

/* Lista densa: rótulo, valor, variação. É o formato que a Dulce
   consegue ler de relance sem interpretar gráfico. Com `top`, mostra
   só os N primeiros e esconde o resto atrás do "ver todas". */
export function Lista({ linhas, formatar = moeda, total, top }: ListaProps) {
  const [aberto, setAberto] = useState(false);
  const max = Math.max(...linhas.map((l) => Math.abs(l.valor)), 1);
  const limitar = top && !aberto && linhas.length > top;
  const visiveis = limitar ? linhas.slice(0, top) : linhas;
  return (
    <div>
      {visiveis.map((l) => (
        <div key={l.rotulo} style={{
          display: "grid", gridTemplateColumns: "1fr 120px", gap: 14, alignItems: "center",
          padding: "8px 20px", borderBottom: `1px solid ${C.hair}`,
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 600, marginBottom: 5,
              color: l.orfa ? C.faint : C.bright,
              fontStyle: l.orfa ? "italic" : "normal",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }} title={l.rotulo}>
              {l.rotulo}
            </div>
            <div style={{ height: 3, borderRadius: 3, background: alfa("sup", 0.06), overflow: "hidden" }}>
              <div style={{
                width: `${(Math.abs(l.valor) / max) * 100}%`, height: "100%", borderRadius: 3,
                background: l.orfa ? C.faint : `linear-gradient(90deg, ${C.goldBase}, ${C.gold})`,
              }} />
            </div>
          </div>
          <span style={{
            fontFamily: GROTESK, fontSize: 14.5, fontWeight: 700, textAlign: "right",
            color: l.orfa ? C.faint : C.text,
          }}>
            {formatar(l.valor)}
          </span>
        </div>
      ))}
      {top && linhas.length > top && (
        <VerTodas aberto={aberto} resto={linhas.length - top} onClick={() => setAberto((a) => !a)} />
      )}
      {total != null && (
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 120px", gap: 14,
          padding: "11px 20px", background: alfa("sup", 0.02),
        }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: C.bright }}>Total</span>
          <span style={{ fontFamily: GROTESK, fontSize: 15, fontWeight: 700, textAlign: "right", color: C.gold }}>
            {formatar(total)}
          </span>
        </div>
      )}
    </div>
  );
}
