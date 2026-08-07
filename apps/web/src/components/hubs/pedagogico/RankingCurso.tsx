"use client";

import { Estado } from "@/components/ui/Estado";
import { C, GROTESK, alfa } from "@/lib/tema";
import { numero } from "@/lib/formato";

export interface LinhaRankingCurso {
  rotulo: string;
  valor: number;
  amostra: number;
}

/* Ranking de cursos por uma taxa (0–100): fideliza (recompra, dourado) e
   falta (dourado→âmbar). Mostra a amostra pra ninguém ler um n=2 como
   tendência. Barra proporcional à própria taxa. */
export function RankingCurso({
  linhas, cor, sufixo, vazioTitulo, vazioDica,
}: {
  linhas: readonly LinhaRankingCurso[];
  cor: string;
  sufixo: string;
  vazioTitulo?: string;
  vazioDica?: string;
}) {
  if (!linhas.length) return <Estado vazio vazioTitulo={vazioTitulo} vazioDica={vazioDica} />;
  const max = Math.max(...linhas.map((l) => l.valor), 1);
  return (
    <div>
      {linhas.map((l, i) => (
        <div key={l.rotulo + i} style={{ padding: "7px 20px", borderBottom: `1px solid ${C.hair}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: C.bright, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={l.rotulo}>{l.rotulo}</span>
            <span style={{ display: "flex", alignItems: "baseline", gap: 8, flexShrink: 0 }}>
              <span style={{ fontSize: 10.5, color: C.faint }}>{numero(l.amostra)} {sufixo}</span>
              <span style={{ fontFamily: GROTESK, fontSize: 13.5, fontWeight: 700, color: cor }}>{l.valor.toFixed(0)}%</span>
            </span>
          </div>
          <div style={{ height: 5, borderRadius: 3, background: alfa("sup", 0.06), overflow: "hidden" }}>
            <div style={{ width: `${(l.valor / max) * 100}%`, height: "100%", borderRadius: 3, background: cor }} />
          </div>
        </div>
      ))}
    </div>
  );
}
