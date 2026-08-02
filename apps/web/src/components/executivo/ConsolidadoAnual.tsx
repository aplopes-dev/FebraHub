"use client";

/* Consolidado dos anos (spec §8): total por ano, variação contra o ano
   anterior — inteiro E no período equivalente (docs/DESCOBERTAS.md §9:
   ano parcial contra ano cheio engana) —, média mensal, melhor/pior mês,
   meta anual quando cadastrada e a projeção do ano corrente com confiança. */

import { useState } from "react";
import { LinhaEvolucao } from "@/components/graficos/LinhaEvolucao";
import { Bloco } from "@/components/ui/Bloco";
import { Estado } from "@/components/ui/Estado";
import { C, GROTESK } from "@/lib/tema";
import { useAnualIndicador } from "@/hooks/executivo";
import type { CardIndicador } from "@/types/executivo";
import { mesCurtoAno, pctFmt, rotuloConfianca, valorFmt } from "./formatos";

function Variacao({ pct }: { pct: number | null }) {
  if (pct == null) return <span style={{ color: C.faint }}>—</span>;
  const cor = pct >= 0 ? C.up : C.down;
  return (
    <span style={{ color: cor, fontWeight: 800 }}>
      {pct >= 0 ? "+" : "−"}{pctFmt(pct)}
    </span>
  );
}

export function ConsolidadoAnual({ candidatos }: { candidatos: CardIndicador[] }) {
  const [codigo, setCodigo] = useState(candidatos[0]?.codigo ?? "receita_cursos");
  const escolhido = candidatos.find((c) => c.codigo === codigo) ?? candidatos[0];
  const anual = useAnualIndicador(escolhido?.codigo ?? "receita_cursos");
  const d = anual.data;
  const ehRazao = !!escolhido?.razao;

  return (
    <Bloco
      titulo="Consolidado dos anos"
      canto={
        <select value={codigo} onChange={(e) => setCodigo(e.target.value)} className="fh-exec-select"
          aria-label="Indicador do consolidado anual">
          {candidatos.map((c) => (
            <option key={c.codigo} value={c.codigo}>{c.nome}</option>
          ))}
        </select>
      }
      sem
    >
      <Estado carregando={anual.isLoading} erro={anual.error} vazio={!d?.linhas.length}
        vazioTitulo="Sem histórico anual" vazioDica="Este indicador ainda não tem meses fechados suficientes.">
        {d && (
          <>
            <div className="fh-rolagem-x">
              <table className="fh-exec-tabela">
                <thead>
                  <tr>
                    <th>Ano</th>
                    <th>{ehRazao ? "Média anual" : "Total"}</th>
                    <th>vs. ano anterior</th>
                    <th>mesmo período</th>
                    <th>Média mensal</th>
                    <th>Melhor mês</th>
                    <th>Pior mês</th>
                    <th>Meta do ano</th>
                  </tr>
                </thead>
                <tbody>
                  {[...d.linhas].reverse().map((l) => (
                    <tr key={l.ano}>
                      <td style={{ fontWeight: 800, color: C.bright }}>
                        {l.ano}
                        {!l.completo && (
                          <span style={{ fontSize: 10, color: C.warn, fontWeight: 700 }}> · {l.mesesComDado}m</span>
                        )}
                      </td>
                      <td style={{ fontFamily: GROTESK, fontWeight: 700 }}>{valorFmt(d.unidade, l.total)}</td>
                      <td><Variacao pct={l.variacaoAnoAnterior} /></td>
                      <td>
                        {l.completo ? (
                          <span style={{ color: C.faint }}>—</span>
                        ) : (
                          <Variacao pct={l.variacaoPeriodoEquivalente} />
                        )}
                      </td>
                      <td>{valorFmt(d.unidade, l.mediaMensal)}</td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {l.melhorMes ? `${mesCurtoAno(l.melhorMes.mes)} · ${valorFmt(d.unidade, l.melhorMes.valor)}` : "—"}
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {l.piorMes ? `${mesCurtoAno(l.piorMes.mes)} · ${valorFmt(d.unidade, l.piorMes.valor)}` : "—"}
                      </td>
                      <td>{l.metaAno != null ? valorFmt(d.unidade, l.metaAno) : <span style={{ color: C.faint }}>sem meta</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {d.projecaoAnoCorrente && (
              <div style={{ padding: "10px 20px", borderTop: `1px solid ${C.hair}`, fontSize: 11.5, color: C.muted, lineHeight: 1.5 }}>
                <b style={{ color: C.bright }}>Projeção do ano corrente:</b>{" "}
                {valorFmt(d.unidade, d.projecaoAnoCorrente.central)}
                {d.projecaoAnoCorrente.faixaMin != null && d.projecaoAnoCorrente.faixaMax != null && (
                  <> · faixa provável {valorFmt(d.unidade, d.projecaoAnoCorrente.faixaMin)} a {valorFmt(d.unidade, d.projecaoAnoCorrente.faixaMax)}</>
                )}
                {" "}· {rotuloConfianca(d.projecaoAnoCorrente.confianca)}.
                <span style={{ color: C.faint }}> {d.projecaoAnoCorrente.metodo}</span>
              </div>
            )}

            <div style={{ padding: "8px 12px 14px" }}>
              <LinhaEvolucao
                serie={d.serieMensal.map((p) => ({ mes: p.mes, valor: p.valor, parcial: p.parcial }))}
                formatar={(v) => valorFmt(d.unidade, v)}
                soDestaques
              />
            </div>
          </>
        )}
      </Estado>
    </Bloco>
  );
}
