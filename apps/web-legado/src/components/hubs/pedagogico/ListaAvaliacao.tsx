"use client";

import { C, GROTESK } from "@/lib/tema";
import { nota1, numero } from "@/lib/formato";
import type { PedagogicoAvaliacao } from "@/types/views";

/* Lista de avaliações por curso/evento. `comTreinador`: no GGB mostra a nota
   do treinador ao lado da indicação (alunos); em eventos ela não existe. */
export function ListaAvaliacao({ linhas, comTreinador }: { linhas: readonly PedagogicoAvaliacao[]; comTreinador?: boolean }) {
  return (
    <div>
      {linhas.map((r, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "9px 20px", borderBottom: `1px solid ${C.hair}` }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: C.bright, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.curso ?? ""}>{r.curso}</div>
            <div style={{ fontSize: 10.5, color: C.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.treinador || "—"} · {numero(r.respondentes)} resp.</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
            <span style={{ textAlign: "right", width: 62 }}>
              <div style={{ fontFamily: GROTESK, fontSize: 14, fontWeight: 700, color: C.up }}>{nota1(r.media_indicacao)}</div>
              <div style={{ fontSize: 9, color: C.dim }}>indicação</div>
            </span>
            {comTreinador && (
              <span style={{ textAlign: "right", width: 62 }}>
                <div style={{ fontFamily: GROTESK, fontSize: 14, fontWeight: 700, color: r.media_nota_treinador != null ? C.gold : C.faint }}>{r.media_nota_treinador != null ? nota1(r.media_nota_treinador) : "—"}</div>
                <div style={{ fontSize: 9, color: C.dim }}>treinador</div>
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
