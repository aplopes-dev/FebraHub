"use client";

import { C, GROTESK } from "@/lib/tema";
import { moeda, numero } from "@/lib/formato";

export interface LinhaAtribuida {
  chave: string;
  semCampanha: boolean;
  rotulo: string;
  categoria: string;
  vendas: number;
  faturamento: number;
}

/* Vendas com origem confirmada em anúncio.

   BLOCO SEPARADO DA PERFORMANCE POR CAMPANHA, DE PROPÓSITO. O investimento
   da tabela de performance é o valor CHEIO da campanha; o faturamento aqui
   é um PISO (~7% das vendas — só as que casaram com um lead de anúncio).
   Dividir um pelo outro daria um ROI falso: parcial sobre total. Por isso
   os dois números convivem na tela sem nenhuma operação entre eles. */
export function VendasAtribuidas({ linhas }: { linhas: readonly LinhaAtribuida[] }) {
  const cols = "minmax(150px,1fr) 88px 62px 96px";
  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ minWidth: 420 }}>
        <div style={{
          display: "grid", gridTemplateColumns: cols, gap: 10, padding: "0 20px 9px",
          borderBottom: `1px solid ${C.hair}`, fontSize: 9.5, fontWeight: 800,
          letterSpacing: ".5px", textTransform: "uppercase", color: C.dim,
        }}>
          <span>Campanha</span>
          <span>Categoria</span>
          <span style={{ textAlign: "right" }}>Vendas</span>
          <span style={{ textAlign: "right" }}>Faturamento</span>
        </div>
        {linhas.map((l) => (
          <div key={l.chave} style={{
            display: "grid", gridTemplateColumns: cols, gap: 10, alignItems: "center",
            padding: "8px 20px", borderBottom: `1px solid ${C.hair}`,
          }}>
            <span style={{
              fontSize: 12, fontWeight: l.semCampanha ? 500 : 600,
              color: l.semCampanha ? C.faint : C.bright,
              fontStyle: l.semCampanha ? "italic" : "normal",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }} title={l.rotulo}>
              {l.rotulo}
            </span>
            <span style={{ fontSize: 11, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {l.semCampanha ? "—" : l.categoria}
            </span>
            <span style={{ fontFamily: GROTESK, fontSize: 12.5, fontWeight: 700, textAlign: "right", color: l.semCampanha ? C.faint : C.text }}>
              {numero(l.vendas)}
            </span>
            <span style={{ fontFamily: GROTESK, fontSize: 13, fontWeight: 700, textAlign: "right", color: l.semCampanha ? C.faint : C.gold }}>
              {moeda(l.faturamento)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
