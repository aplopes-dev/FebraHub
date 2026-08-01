"use client";

import { ArrowUpRight, Smile, X } from "lucide-react";
import { Estado } from "@/components/ui/Estado";
import { C, GROTESK } from "@/lib/tema";
import { moeda } from "@/lib/formato";

export interface VendaVerde {
  data?: string | null;
  cliente?: string | null;
  curso?: string | null;
  valor: number;
  formas?: string | null;
  link_salesforce?: string | null;
}

/* Detalhe das vendas verdes de uma consultora, no período. A coluna `formas`
   é o ponto: deixa a classificação AUDITÁVEL (pedido do financeiro). O
   link_salesforce abre a oportunidade em nova aba. Painel lateral (drawer)
   com scroll interno — cabe numa TV sem empurrar o resto. */
export function PainelVerdes({
  consultora, rotulo, linhas, carregando, erro, onFechar,
}: {
  consultora: string;
  rotulo: string;
  linhas: readonly VendaVerde[];
  carregando?: boolean;
  erro?: Error | null;
  onFechar: () => void;
}) {
  return (
    <>
      <div onClick={onFechar} style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(0,0,0,.55)" }} />
      <div className="rolagem" style={{
        position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 71, width: "min(560px, 94vw)",
        background: "#101014", borderLeft: `1px solid ${C.cardLine}`,
        boxShadow: "-18px 0 48px rgba(0,0,0,.5)", display: "flex", flexDirection: "column",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "16px 20px", borderBottom: `1px solid ${C.hair}`, flexShrink: 0 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <Smile size={15} style={{ color: C.up }} />
              <span style={{ fontSize: 14.5, fontWeight: 800, color: C.bright }}>Vendas verdes · {consultora}</span>
            </div>
            <div style={{ fontSize: 11, color: C.faint, marginTop: 3 }}>
              {rotulo} · 100% Pix/transferência/dinheiro · {linhas.length} venda{linhas.length === 1 ? "" : "s"}
            </div>
          </div>
          <button onClick={onFechar} aria-label="Fechar" style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0, cursor: "pointer",
            background: "rgba(255,255,255,.05)", border: `1px solid ${C.cardLine}`, color: C.muted,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          <Estado
            carregando={carregando}
            erro={erro}
            vazio={!linhas.length}
            vazioTitulo="Sem vendas verdes no período"
            vazioDica={`Nenhuma venda 100% Pix/transferência/dinheiro de ${consultora} em ${rotulo}.`}
          >
            {linhas.map((v, i) => (
              <div key={i} style={{ padding: "12px 20px", borderBottom: `1px solid ${C.hair}` }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.bright, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {v.cliente || "—"}
                  </span>
                  <span style={{ fontFamily: GROTESK, fontSize: 14, fontWeight: 700, color: C.up, flexShrink: 0 }}>
                    {moeda(v.valor)}
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: C.muted, marginTop: 3 }}>{v.curso || "—"}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10.5, color: C.faint }}>{v.data ? String(v.data).slice(0, 10) : "—"}</span>
                  {/* `formas` é o que torna a classificação auditável. */}
                  {v.formas && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: C.up, background: `${C.up}18`,
                      border: `1px solid ${C.up}44`, borderRadius: 5, padding: "1px 7px",
                    }}>
                      {v.formas}
                    </span>
                  )}
                  {v.link_salesforce && (
                    <a href={v.link_salesforce} target="_blank" rel="noopener noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 700, color: C.gold, textDecoration: "none", marginLeft: "auto" }}>
                      Salesforce <ArrowUpRight size={12} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </Estado>
        </div>
      </div>
    </>
  );
}
