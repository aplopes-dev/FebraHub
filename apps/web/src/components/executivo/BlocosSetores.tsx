"use client";

/* Hub por setor (spec §13): um bloco por setor com os indicadores dele em
   miniatura (valor + status), contagem de alertas, qualidade da fonte e os
   dois caminhos — a análise do indicador e o hub operacional do setor. */

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { C, GROTESK, alfaDe } from "@/lib/tema";
import { HUBS } from "@/lib/hubs";
import type { BlocoSetor, CardIndicador } from "@/types/executivo";
import { corStatus, valorFmt } from "./formatos";

export function BlocosSetores({
  setores,
  cards,
  linkIndicador,
}: {
  setores: BlocoSetor[];
  cards: CardIndicador[];
  linkIndicador: (codigo: string) => string;
}) {
  const porCodigo = new Map(cards.map((c) => [c.codigo, c]));
  return (
    <div className="fh-exec-setores">
      {setores.map((s) => {
        const doSetor = s.indicadores
          .map((c) => porCodigo.get(c))
          .filter((c): c is CardIndicador => !!c);
        const hubOperacional = HUBS.find((h) => h.key === s.setor);
        const corQualidade =
          s.qualidade === "ok" ? C.up : s.qualidade === "atencao" ? C.warn : C.down;
        return (
          <section key={s.setor} className="fh-exec-setor" aria-label={`Setor ${s.nome}`}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <h3 style={{ fontSize: 13, fontWeight: 800, color: C.bright }}>{s.nome}</h3>
                {s.alertas > 0 && (
                  <span className="fh-exec-badge" style={{ color: C.warn, background: alfaDe(C.warn, 0.12), borderColor: alfaDe(C.warn, 0.25) }}>
                    {s.alertas} {s.alertas === 1 ? "alerta" : "alertas"}
                  </span>
                )}
              </div>
              <span title={`Qualidade das fontes: ${s.qualidade}`}
                style={{ width: 8, height: 8, borderRadius: "50%", background: corQualidade, flexShrink: 0 }} />
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              {doSetor.map((c) => (
                <Link key={c.codigo} href={linkIndicador(c.codigo)} className="fh-exec-mini">
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: corStatus(c.status.nivel), flexShrink: 0 }}
                    title={c.status.rotulo} />
                  <span style={{ fontSize: 11.5, color: C.muted, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                    {c.curto}
                  </span>
                  <span style={{ fontFamily: GROTESK, fontSize: 12.5, fontWeight: 700, color: C.text, whiteSpace: "nowrap" }}>
                    {valorFmt(c.unidade, c.valor)}
                    {c.parcial && <span style={{ fontSize: 9, color: C.warn }}> p</span>}
                  </span>
                </Link>
              ))}
            </div>

            {hubOperacional && (
              <Link href={`/${s.setor}`} style={{
                display: "inline-flex", alignItems: "center", gap: 4, marginTop: 10,
                fontSize: 11, fontWeight: 800, color: C.gold, textDecoration: "none",
              }}>
                Abrir hub {s.nome} <ArrowUpRight size={12} />
              </Link>
            )}
          </section>
        );
      })}
    </div>
  );
}
