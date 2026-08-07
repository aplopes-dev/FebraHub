"use client";

import { Database } from "lucide-react";
import { Spark } from "@/components/graficos/Spark";
import { C, GROTESK } from "@/lib/tema";
import { moeda } from "@/lib/formato";
import type { PontoSerie } from "@/lib/dados";

/* Caixa recebido — card destaque verde. Cobre SÓ a CisPay; a Stone
   ainda não está integrada. Rotulado "Caixa CisPay (parcial)" — nunca
   como caixa total, senão vira número que engana. */
export function CaixaCard({ serie, semFonte }: { serie: readonly PontoSerie[]; semFonte?: boolean }) {
  if (semFonte || !serie.length) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%", gap: 8 }}>
        <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 600 }}>Caixa CisPay</div>
        <div style={{ display: "flex", gap: 8 }}>
          <Database size={14} style={{ color: C.faint, marginTop: 2, flexShrink: 0 }} />
          <span style={{ fontSize: 11.5, color: C.faint, lineHeight: 1.5 }}>
            Aguardando a view <b style={{ color: C.muted }}>vw_financeiro_caixa_mensal</b>. Quando existir, mostra o caixa recebido da CisPay (parcial — Stone fora).
          </span>
        </div>
      </div>
    );
  }
  const atual = serie[serie.length - 1].valor;
  const ant = serie[serie.length - 2]?.valor;
  const pct = ant ? ((atual - ant) / Math.abs(ant)) * 100 : null;
  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
      <div>
        <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 600 }}>Caixa CisPay <span style={{ color: C.faint }}>· parcial</span></div>
        <div style={{ fontFamily: GROTESK, fontSize: 32, fontWeight: 700, letterSpacing: "-1px", marginTop: 6, color: C.up }}>{moeda(atual)}</div>
        {pct != null && (
          <div style={{ fontSize: 12, fontWeight: 800, color: pct >= 0 ? C.up : C.down, marginTop: 4 }}>
            {pct >= 0 ? "▲" : "▼"} {Math.abs(pct).toFixed(0)}% vs mês anterior
          </div>
        )}
        <div style={{ fontSize: 10.5, color: C.faint, marginTop: 6, lineHeight: 1.5 }}>Só CisPay — a Stone ainda não está integrada. Não é o caixa total.</div>
      </div>
      <div style={{ height: 34, marginTop: 10 }}><Spark serie={serie} cor={C.up} /></div>
    </div>
  );
}
