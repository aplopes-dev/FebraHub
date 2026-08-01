"use client";

import { Construction } from "lucide-react";
import { C, GROTESK, SOBRE_OURO, alfa } from "@/lib/tema";
import { numero } from "@/lib/formato";

/* Funil desenhado, não medido. Só "Leads gerados" tem número: as etapas
   seguintes dependem do acompanhamento do pedagógico, que ainda não entrega
   dado. As larguras abaixo são DECORAÇÃO — por isso cada etapa sem fonte
   sai tracejada, sem número e escrita "sem medição". */
const ETAPAS_FUNIL = [
  { nome: "Leads gerados", larg: 100 },
  { nome: "Contato realizado", larg: 76 },
  { nome: "Reunião / visita", larg: 54 },
  { nome: "Matrícula", larg: 36 },
];

export function FunilConversao({ leads }: { leads: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {ETAPAS_FUNIL.map((e, i) => {
        const real = i === 0;
        return (
          <div key={e.nome} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: `${e.larg}%`, minWidth: 92, height: 34, borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "0 12px", gap: 10,
              background: real ? `linear-gradient(90deg, ${C.goldBase}, ${C.gold})` : alfa("sup", 0.025),
              border: real ? "none" : `1px dashed ${C.cardLine}`,
            }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: real ? SOBRE_OURO : C.dim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {e.nome}
              </span>
              <span style={{ fontFamily: GROTESK, fontSize: real ? 14 : 11.5, fontWeight: 700, color: real ? SOBRE_OURO : C.dim, flexShrink: 0, fontStyle: real ? "normal" : "italic" }}>
                {real ? numero(leads) : "sem medição"}
              </span>
            </div>
          </div>
        );
      })}
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <Construction size={13} style={{ color: C.warn, marginTop: 2, flexShrink: 0 }} />
        <span style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.5 }}>
          Em construção — aguardando integração do pedagógico. Só <b style={{ color: C.bright }}>leads gerados</b> é
          medido hoje; as etapas seguintes não têm fonte, e as larguras acima são desenho, não proporção.
        </span>
      </div>
    </div>
  );
}
