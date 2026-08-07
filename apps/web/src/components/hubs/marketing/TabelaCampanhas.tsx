"use client";

import { useState, type CSSProperties } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { C, GROTESK, alfa } from "@/lib/tema";
import { moeda, numero, reaisCent } from "@/lib/formato";

export interface CampanhaLinha {
  nome: string;
  tipo: string;
  categoria: string;
  gasto: number;
  leads: number;
  gastoCapt: number;
  leadsCapt: number;
  cpl: number | null;
}

export interface GrupoCampanha {
  chave: string;
  gasto: number;
  leads: number;
  tipo: string;
  categoria: string;
  cpl: number | null;
  campanhas: CampanhaLinha[];
}

/* Performance por campanha. Investimento, leads e CPL são reais. Vendas,
   receita e ROI ficam na tabela como colunas vazias marcadas "em breve" —
   o desenho já reserva o lugar, mas nenhuma delas existe na view (conferido
   por probe: 42703). Agrupa por produto e expande sob clique. */
export function TabelaCampanhas({ grupos }: { grupos: readonly GrupoCampanha[] }) {
  // A chave do grupo é `chave` (o valor de produto OU de categoria, conforme
  // o "Agrupar por"). No protótipo o toggle lia `g.produto`, que não existe
  // no objeto agregado — todas as linhas compartilhavam a chave `undefined` e
  // abriam juntas. Aqui cada linha abre a sua.
  const [abertos, setAbertos] = useState<Set<string>>(() => new Set());
  const alternar = (p: string) => setAbertos((s) => {
    const n = new Set(s);
    if (n.has(p)) n.delete(p); else n.add(p);
    return n;
  });
  const cols = "minmax(130px,1fr) 78px 92px 92px 56px 80px 60px 74px 50px";
  const cel = (extra?: CSSProperties): CSSProperties => ({ fontFamily: GROTESK, fontSize: 12.5, fontWeight: 700, textAlign: "right", ...extra });
  const vazia: CSSProperties = { fontSize: 11.5, textAlign: "right", color: C.dim, fontStyle: "italic" };

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ minWidth: 780 }}>
        <div style={{
          display: "grid", gridTemplateColumns: cols, gap: 10, padding: "0 20px 9px",
          borderBottom: `1px solid ${C.hair}`, fontSize: 9.5, fontWeight: 800,
          letterSpacing: ".5px", textTransform: "uppercase", color: C.dim,
        }}>
          <span>Campanha</span>
          <span>Categoria</span>
          <span>Tipo</span>
          <span style={{ textAlign: "right" }}>Investimento</span>
          <span style={{ textAlign: "right" }}>Leads</span>
          <span style={{ textAlign: "right" }}>Custo/lead</span>
          <span style={{ textAlign: "right", color: C.faint }}>Vendas</span>
          <span style={{ textAlign: "right", color: C.faint }}>Receita</span>
          <span style={{ textAlign: "right", color: C.faint }}>ROI</span>
        </div>

        {grupos.map((g) => {
          const aberto = abertos.has(g.chave);
          return (
            <div key={g.chave}>
              <div onClick={() => alternar(g.chave)} role="button" tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); alternar(g.chave); } }}
                style={{
                  display: "grid", gridTemplateColumns: cols, gap: 10, alignItems: "center",
                  padding: "9px 20px", borderBottom: `1px solid ${C.hair}`, cursor: "pointer",
                  background: aberto ? alfa("sup", 0.022) : "transparent",
                }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                  {aberto ? <ChevronUp size={13} style={{ color: C.gold, flexShrink: 0 }} /> : <ChevronDown size={13} style={{ color: C.faint, flexShrink: 0 }} />}
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: C.bright, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={g.chave}>
                    {g.chave}
                  </span>
                  <span style={{ fontSize: 10, color: C.dim, flexShrink: 0 }}>· {g.campanhas.length}</span>
                </span>
                <span style={{ fontSize: 11, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={g.categoria}>{g.categoria}</span>
                <span style={{ fontSize: 11, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.tipo}</span>
                <span style={cel({ color: C.gold })}>{moeda(g.gasto)}</span>
                <span style={cel({ color: C.text })}>{g.leads ? numero(g.leads) : "—"}</span>
                <span style={cel({ color: g.cpl != null ? C.text : C.dim })}>{g.cpl != null ? reaisCent(g.cpl) : "—"}</span>
                <span style={vazia}>em breve</span>
                <span style={vazia}>em breve</span>
                <span style={vazia}>em breve</span>
              </div>

              {aberto && g.campanhas.map((c) => (
                <div key={c.nome} style={{
                  display: "grid", gridTemplateColumns: cols, gap: 10, alignItems: "center",
                  padding: "7px 20px 7px 40px", borderBottom: `1px solid ${C.hair}`,
                  background: alfa("sup", 0.012),
                }}>
                  <span style={{ fontSize: 11.5, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={c.nome}>{c.nome}</span>
                  <span style={{ fontSize: 10.5, color: C.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={c.categoria}>{c.categoria}</span>
                  <span style={{ fontSize: 10.5, color: C.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.tipo}</span>
                  <span style={cel({ fontSize: 11.5, color: C.muted })}>{moeda(c.gasto)}</span>
                  <span style={cel({ fontSize: 11.5, color: C.muted })}>{c.leads ? numero(c.leads) : "—"}</span>
                  <span style={cel({ fontSize: 11.5, color: c.cpl != null ? C.muted : C.dim })}>{c.cpl != null ? reaisCent(c.cpl) : "—"}</span>
                  <span style={vazia}>—</span>
                  <span style={vazia}>—</span>
                  <span style={vazia}>—</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
