"use client";

/* Consolidado dos anos — tiles, barras interativas e evolução mensal. */

import { useMemo, useState } from "react";
import { Estado } from "@/components/ui/Estado";
import { Select } from "@/components/ui/Select";
import { C, GROTESK, alfaDe } from "@/lib/tema";
import { useAnualIndicador } from "@/hooks/executivo";
import type { CardIndicador } from "@/types/executivo";
import { mesCurtoAno, pctFmt, rotuloConfianca, valorFmt } from "./formatos";
import { GraficoAnosBarras } from "./graficos/GraficoAnosBarras";
import { GraficoEvolucaoAnual } from "./graficos/GraficoEvolucaoAnual";

function VariacaoBadge({ pct }: { pct: number | null }) {
  if (pct == null) return <span className="fh-exec-ano-delta fh-exec-ano-delta-neutro">—</span>;
  const up = pct >= 0;
  return (
    <span className={`fh-exec-ano-delta ${up ? "fh-exec-ano-delta-up" : "fh-exec-ano-delta-down"}`}>
      {up ? "+" : "−"}{pctFmt(Math.abs(pct))}
    </span>
  );
}

export function ConsolidadoAnual({ candidatos }: { candidatos: CardIndicador[] }) {
  const [codigo, setCodigo] = useState(candidatos[0]?.codigo ?? "receita_cursos");
  const [anoFoco, setAnoFoco] = useState<number | null>(null);
  const escolhido = candidatos.find((c) => c.codigo === codigo) ?? candidatos[0];
  const anual = useAnualIndicador(escolhido?.codigo ?? "receita_cursos");
  const d = anual.data;
  const ehRazao = !!escolhido?.razao;

  const linhas = useMemo(
    () => (d ? [...d.linhas].reverse() : []),
    [d],
  );

  const foco = linhas.find((l) => l.ano === anoFoco) ?? linhas[0] ?? null;
  const maxTotal = Math.max(...linhas.map((l) => l.total), 1);

  return (
    <section className="fh-exec-anual" aria-label="Consolidado dos anos">
      <div className="fh-exec-anual-cabeca">
        <div>
          <p className="fh-exec-kicker">Histórico</p>
          <h2 className="fh-exec-resumo-titulo">Consolidado dos anos</h2>
        </div>
        <Select
          value={codigo}
          onChange={(v) => { setCodigo(v); setAnoFoco(null); }}
          className="fh-exec-select"
          style={{ minWidth: 180 }}
          aria-label="Indicador do consolidado anual"
          options={candidatos.map((c) => ({ value: c.codigo, label: c.nome }))}
        />
      </div>

      <Estado
        carregando={anual.isLoading}
        erro={anual.error}
        vazio={!d?.linhas.length}
        vazioTitulo="Sem histórico anual"
        vazioDica="Este indicador ainda não tem meses fechados suficientes."
      >
        {d && (
          <>
            <div className="fh-exec-anos" role="list">
              {linhas.map((l, i) => {
                const ativo = (foco?.ano ?? linhas[0]?.ano) === l.ano;
                const altura = Math.max(8, Math.round((l.total / maxTotal) * 100));
                const varMostrar = l.completo ? l.variacaoAnoAnterior : l.variacaoPeriodoEquivalente;
                return (
                  <button
                    key={l.ano}
                    type="button"
                    role="listitem"
                    className={`fh-exec-ano fh-exec-reveal${ativo ? " fh-exec-ano-ativo" : ""}`}
                    style={{ animationDelay: `${40 + i * 45}ms` }}
                    onClick={() => setAnoFoco(l.ano)}
                    aria-pressed={ativo}
                  >
                    <div className="fh-exec-ano-topo">
                      <span className="fh-exec-ano-label">
                        {l.ano}
                        {!l.completo && <em> · {l.mesesComDado}m</em>}
                      </span>
                      <VariacaoBadge pct={varMostrar} />
                    </div>
                    <div className="fh-exec-ano-valor" style={{ fontFamily: GROTESK }}>
                      {valorFmt(d.unidade, l.total)}
                    </div>
                    <div className="fh-exec-ano-barra" aria-hidden>
                      <span style={{ height: `${altura}%` }} />
                    </div>
                    <div className="fh-exec-ano-meta">
                      {ehRazao ? "média anual" : "total"}
                      {l.metaAno != null ? ` · meta ${valorFmt(d.unidade, l.metaAno)}` : ""}
                    </div>
                  </button>
                );
              })}
            </div>

            {foco && (
              <div className="fh-exec-ano-detalhe fh-exec-reveal" style={{ animationDelay: "120ms" }}>
                <div className="fh-exec-ano-stat">
                  <span className="fh-exec-num-rotulo">Média mensal</span>
                  <b style={{ fontFamily: GROTESK }}>{valorFmt(d.unidade, foco.mediaMensal)}</b>
                </div>
                <div className="fh-exec-ano-stat">
                  <span className="fh-exec-num-rotulo">Melhor mês</span>
                  <b>
                    {foco.melhorMes
                      ? `${mesCurtoAno(foco.melhorMes.mes)} · ${valorFmt(d.unidade, foco.melhorMes.valor)}`
                      : "—"}
                  </b>
                </div>
                <div className="fh-exec-ano-stat">
                  <span className="fh-exec-num-rotulo">Pior mês</span>
                  <b>
                    {foco.piorMes
                      ? `${mesCurtoAno(foco.piorMes.mes)} · ${valorFmt(d.unidade, foco.piorMes.valor)}`
                      : "—"}
                  </b>
                </div>
                <div className="fh-exec-ano-stat">
                  <span className="fh-exec-num-rotulo">vs. ano anterior</span>
                  <b><VariacaoBadge pct={foco.variacaoAnoAnterior} /></b>
                </div>
                {!foco.completo && (
                  <div className="fh-exec-ano-stat">
                    <span className="fh-exec-num-rotulo">mesmo período</span>
                    <b><VariacaoBadge pct={foco.variacaoPeriodoEquivalente} /></b>
                  </div>
                )}
              </div>
            )}

            {d.projecaoAnoCorrente && (
              <div
                className="fh-exec-projecao fh-exec-reveal"
                style={{
                  animationDelay: "160ms",
                  borderColor: alfaDe(C.gold, 0.35),
                  background: `linear-gradient(120deg, ${alfaDe(C.gold, 0.16)}, ${alfaDe(C.gold, 0.04)} 55%)`,
                }}
              >
                <div>
                  <p className="fh-exec-kicker" style={{ marginBottom: 4 }}>Projeção do ano corrente</p>
                  <div className="fh-exec-projecao-valor" style={{ fontFamily: GROTESK }}>
                    {valorFmt(d.unidade, d.projecaoAnoCorrente.central)}
                  </div>
                </div>
                <div className="fh-exec-projecao-meta">
                  {d.projecaoAnoCorrente.faixaMin != null && d.projecaoAnoCorrente.faixaMax != null && (
                    <span>
                      Faixa {valorFmt(d.unidade, d.projecaoAnoCorrente.faixaMin)} →{" "}
                      {valorFmt(d.unidade, d.projecaoAnoCorrente.faixaMax)}
                    </span>
                  )}
                  <span>{rotuloConfianca(d.projecaoAnoCorrente.confianca)}</span>
                  <span className="fh-exec-projecao-metodo">{d.projecaoAnoCorrente.metodo}</span>
                </div>
              </div>
            )}

            <div className="fh-exec-charts-duplo fh-exec-reveal" style={{ animationDelay: "200ms" }}>
              <div className="fh-exec-chart-shell">
                <div className="fh-exec-chart-cabeca">
                  <span>Por ano</span>
                  <span>Clique na barra para focar</span>
                </div>
                <GraficoAnosBarras
                  linhas={d.linhas}
                  unidade={d.unidade}
                  anoFoco={foco?.ano ?? null}
                  onAno={setAnoFoco}
                />
              </div>
              <div className="fh-exec-chart-shell">
                <div className="fh-exec-chart-cabeca">
                  <span>Evolução mensal</span>
                  <span>{d.nome}</span>
                </div>
                <GraficoEvolucaoAnual
                  serie={d.serieMensal}
                  unidade={d.unidade}
                  nome={d.nome}
                />
              </div>
            </div>
          </>
        )}
      </Estado>
    </section>
  );
}
