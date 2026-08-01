"use client";

import { Target } from "lucide-react";
import { resumoMeta } from "./calculos";
import { C, GROTESK, corNivel } from "@/lib/tema";
import { MESES } from "@/lib/dados";
import { moeda } from "@/lib/formato";
import type { LojaMetaMes } from "@/types/views";

/* Selo de meta no card de receita. Lê a linha do mês da
   vw_loja_receita_total_mes (consolidado). Em vez de um "59%" solto (que não
   diz se é bom ou ruim), mostra a FRASE — ex.: "Meta básica batida · faltam
   R$ 5.000 para a máster" — colorida pelo nível. Mês EM CURSO não classifica
   (o mês não acabou): mostra só realizado x meta mínima com o rótulo "em
   curso". Metas são mensais — o selo some no "Geral". */
export function MetaBadge({ meta }: { meta: LojaMetaMes | null }) {
  if (!meta) return null;
  const emCurso = !!meta.em_curso;
  const realizado = Number(meta.receita ?? 0);
  const minima = Number(meta.meta_minima ?? 0);
  const nivel = meta.nivel_atingido ?? "—";
  const mm = String(meta.mes ?? "").slice(5, 7);
  const mesNome = mm ? MESES[Number(mm) - 1] : null;
  const cor = emCurso ? C.muted : corNivel(nivel);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap",
      background: "rgba(255,255,255,.03)", border: `1px solid ${cor}44`,
      borderRadius: 11, padding: "9px 13px",
    }}>
      <Target size={15} style={{ color: cor, flexShrink: 0 }} />
      {mesNome && <span style={{ fontSize: 11.5, color: C.dim, fontWeight: 700 }}>{mesNome}</span>}
      {emCurso ? (
        <span style={{ display: "inline-flex", alignItems: "baseline", gap: 7, flexWrap: "wrap", fontSize: 12, color: C.faint }}>
          <b style={{ fontFamily: GROTESK, fontSize: 15, fontWeight: 700, color: C.bright }}>{moeda(realizado)}</b>
          <span>de {moeda(minima)} · meta mínima</span>
          <span style={{
            fontSize: 11, fontWeight: 800, color: C.muted, background: "rgba(255,255,255,.06)",
            border: `1px solid ${C.cardLine}`, padding: "1px 8px", borderRadius: 6,
          }}>em curso</span>
        </span>
      ) : (
        <span style={{ fontSize: 12.5, fontWeight: 700, color: cor }}>
          {resumoMeta(meta)}
        </span>
      )}
    </div>
  );
}
