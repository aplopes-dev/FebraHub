"use client";

/* ============================================================
   Tela analítica de um indicador (spec §16/§17).

   Chega-se aqui clicando em qualquer card, alerta ou linha de setor —
   e os filtros do hub vêm juntos pela URL. A tela responde: qual é o
   número, contra o quê ele foi comparado, COMO ele é calculado (a
   fórmula do catálogo, não uma paráfrase), de onde vem, quando o dado
   foi atualizado, como ele se decompõe, e quais registros o formam.
   ============================================================ */

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { LinhaEvolucao } from "@/components/graficos/LinhaEvolucao";
import { Bloco } from "@/components/ui/Bloco";
import { Estado } from "@/components/ui/Estado";
import { Lista } from "@/components/ui/Lista";
import { SecaoTitulo } from "@/components/ui/SecaoTitulo";
import { C, GROTESK, alfaDe } from "@/lib/tema";
import {
  useFiltrosExecutivo,
  useIndicadorDetalhe,
  useIndicadorTabela,
  useRitmoMeta,
} from "@/hooks/executivo";
import { urlExportarDetalhe } from "@/services/api/executivo";
import type { ColunaDetalhe } from "@/types/executivo";
import { RitmoMeta } from "./RitmoMeta";
import { corStatus, dataBr, mesLabel, pctFmt, rotuloConfianca, valorFmt } from "./formatos";

const somaMes = (ym: string, n: number): string => {
  const ano = Number(ym.slice(0, 4));
  const mes = Number(ym.slice(5, 7)) - 1 + n;
  const a = ano + Math.floor(mes / 12);
  const m = ((mes % 12) + 12) % 12;
  return `${a}-${String(m + 1).padStart(2, "0")}`;
};

function celula(coluna: ColunaDetalhe, v: unknown): string {
  if (v == null) return "—";
  switch (coluna.tipo) {
    case "brl":
      return valorFmt("brl", Number(v), false);
    case "qtd":
      return valorFmt("qtd", Number(v));
    case "data":
      return dataBr(String(v));
    default:
      return String(v);
  }
}

export function TelaIndicador({ codigo }: { codigo: string }) {
  const filtros = useFiltrosExecutivo();

  // Período das quebras/tabela: por padrão o mês de referência; os presets
  // mudam só o recorte analítico, sem mexer no mês do card.
  const [periodo, setPeriodo] = useState<{ de?: string; ate?: string }>({});
  const detalhe = useIndicadorDetalhe(codigo, filtros.mes, periodo.de, periodo.ate);
  const d = detalhe.data;
  const card = d?.card;

  const podeRitmo = !!card && card.tipo === "fluxo" && !card.razao;
  const ritmo = useRitmoMeta(podeRitmo ? codigo : null, filtros.mes);

  const [pagina, setPagina] = useState(1);
  const tabela = useIndicadorTabela(codigo, !!d?.temTabela, periodo.de ?? d?.periodo.de.slice(0, 7), periodo.ate ?? d?.periodo.ate.slice(0, 7), pagina);

  const mesRef = card?.mes.slice(0, 7) ?? "";
  const presets = useMemo(
    () =>
      mesRef
        ? [
            { rotulo: "Mês de referência", de: undefined, ate: undefined },
            { rotulo: "Últimos 3 meses", de: somaMes(mesRef, -2), ate: mesRef },
            { rotulo: "Últimos 12 meses", de: somaMes(mesRef, -11), ate: mesRef },
            { rotulo: "Ano até aqui", de: `${mesRef.slice(0, 4)}-01`, ate: mesRef },
          ]
        : [],
    [mesRef]
  );
  const presetAtivo =
    presets.find((p) => p.de === periodo.de && p.ate === periodo.ate)?.rotulo ?? presets[0]?.rotulo;

  return (
    <div className="fh-exec">
      <Link href={`/executivo${filtros.query ? `?${filtros.query}` : ""}`}
        style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 800, color: C.muted, textDecoration: "none", marginBottom: 14 }}>
        <ArrowLeft size={14} /> Hub Executivo
      </Link>

      <Estado carregando={detalhe.isLoading} erro={detalhe.error} vazio={!d}>
        {d && card && (
          <>
            {/* ---------- cabeçalho ---------- */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
              <h1 style={{ fontSize: "var(--h1)", fontWeight: 800, color: C.bright, letterSpacing: "-.3px" }}>
                {card.nome}
              </h1>
              <span className="fh-exec-badge" style={{ color: corStatus(card.status.nivel) }}>
                {card.status.rotulo}
              </span>
              <span style={{ fontSize: 11, color: C.faint, fontWeight: 700 }}>{card.setorNome}</span>
            </div>
            <p style={{ fontSize: 12.5, color: C.muted, margin: "6px 0 0", maxWidth: 760, lineHeight: 1.5 }}>
              {card.descricao}
            </p>

            {/* ---------- números-chave ---------- */}
            <div className="fh-exec-numeros">
              <div>
                <div className="fh-exec-num-rotulo">
                  {card.tipo === "estado" ? `Posição${card.referencia ? ` em ${dataBr(card.referencia)}` : ""}` : mesLabel(card.mes)}
                  {card.parcial ? " · parcial" : ""}
                </div>
                <div style={{ fontFamily: GROTESK, fontSize: 24, fontWeight: 700, color: C.text, letterSpacing: "-.6px" }}>
                  {valorFmt(card.unidade, card.valor)}
                </div>
                {card.quantidade != null && (
                  <div style={{ fontSize: 11, color: C.faint }}>{valorFmt("qtd", card.quantidade)} registros</div>
                )}
              </div>
              <div>
                <div className="fh-exec-num-rotulo">Meta</div>
                {card.meta ? (
                  <>
                    <div style={{ fontFamily: GROTESK, fontSize: 17, fontWeight: 700, color: C.text }}>
                      {valorFmt(card.unidade, card.meta.valor)}
                      <span style={{ fontSize: 12, color: C.muted }}> · {pctFmt(card.pctMeta, 0)}</span>
                    </div>
                    <div style={{ fontSize: 11, color: C.faint }}>
                      {card.meta.origem === "loja" ? "planilha oficial da loja" : "cadastrada no painel"}
                      {card.meta.niveis && (
                        <> · mín {valorFmt(card.unidade, card.meta.niveis.minima)} · máster {valorFmt(card.unidade, card.meta.niveis.master)}</>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 13, color: C.faint, fontWeight: 700 }}>Sem meta definida</div>
                )}
              </div>
              {card.parcial && (
                <div>
                  <div className="fh-exec-num-rotulo">Esperado até hoje</div>
                  {card.esperado != null ? (
                    <>
                      <div style={{ fontFamily: GROTESK, fontSize: 17, fontWeight: 700, color: C.text }}>
                        {valorFmt(card.unidade, card.esperado)}
                      </div>
                      <div style={{ fontSize: 11, color: C.faint }}>
                        régua: {card.reguaEsperado === "historico" ? "distribuição histórica do mês" : card.reguaEsperado === "dias_uteis" ? "dias úteis" : "linear"}
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: 13, color: C.faint, fontWeight: 700 }}>— exige meta</div>
                  )}
                </div>
              )}
              {card.projecao && (
                <div>
                  <div className="fh-exec-num-rotulo">Projeção de fechamento</div>
                  <div style={{ fontFamily: GROTESK, fontSize: 17, fontWeight: 700, color: C.text }}>
                    {valorFmt(card.unidade, card.projecao.central)}
                  </div>
                  <div style={{ fontSize: 11, color: C.faint }}>
                    {card.projecao.faixaMin != null && card.projecao.faixaMax != null && (
                      <>faixa {valorFmt(card.unidade, card.projecao.faixaMin)} – {valorFmt(card.unidade, card.projecao.faixaMax)} · </>
                    )}
                    {rotuloConfianca(card.projecao.confianca)}
                  </div>
                </div>
              )}
            </div>

            {card.texto && (
              <p style={{
                fontSize: 13, color: C.text, lineHeight: 1.55, margin: "14px 0 0", maxWidth: 860,
                borderLeft: `3px solid ${alfaDe(corStatus(card.status.nivel), 0.6)}`, paddingLeft: 12,
              }}>
                {card.texto}
              </p>
            )}
            {card.cobertura && (
              <p style={{ fontSize: 11.5, color: C.warn, margin: "10px 0 0", maxWidth: 860 }}>
                Cobertura: {card.cobertura}
              </p>
            )}

            {/* ---------- ritmo do mês ---------- */}
            {podeRitmo && ritmo.data && (
              <div style={{ marginTop: 22 }}>
                <Bloco titulo="Ritmo do mês" canto={card.parcial ? "realizado × esperado × projeção" : "mês fechado"}>
                  <RitmoMeta dados={ritmo.data} unidade={card.unidade} />
                </Bloco>
              </div>
            )}

            {/* ---------- série histórica ---------- */}
            {d.serieCompleta.length >= 2 && (
              <Bloco titulo="Histórico mensal" canto={`${d.serieCompleta.length} meses`}>
                <LinhaEvolucao
                  serie={d.serieCompleta.map((p) => ({ mes: p.mes, valor: p.valor, parcial: p.parcial }))}
                  formatar={(v) => valorFmt(card.unidade, v)}
                  soDestaques
                />
              </Bloco>
            )}

            {/* ---------- como o número nasce ---------- */}
            <Bloco titulo="Como este número é calculado" canto="fórmula do catálogo — a mesma da API">
              <div style={{ display: "grid", gap: 8, fontSize: 12.5, color: C.muted, lineHeight: 1.55 }}>
                <div><b style={{ color: C.bright }}>Fórmula:</b> {d.formula}</div>
                <div>
                  <b style={{ color: C.bright }}>Fonte:</b> {card.qualidade.fonteRotulo} · tabela{" "}
                  <code style={{ fontSize: 11.5, background: alfaDe(C.faint, 0.12), padding: "1px 5px", borderRadius: 5 }}>{d.fonteTabela}</code>
                </div>
                <div>
                  <b style={{ color: C.bright }}>Atualização:</b> {card.qualidade.rotulo}
                  {card.qualidade.ultimaSync && <> · última sincronização {dataBr(card.qualidade.ultimaSync.slice(0, 10))}</>}
                </div>
              </div>
            </Bloco>

            {/* ---------- quebras ---------- */}
            {d.quebras.length > 0 && (
              <>
                <SecaoTitulo
                  titulo="Composição"
                  canto={
                    <span style={{ display: "inline-flex", gap: 6, flexWrap: "wrap" }}>
                      {presets.map((p) => (
                        <button key={p.rotulo} type="button"
                          onClick={() => { setPeriodo({ de: p.de, ate: p.ate }); setPagina(1); }}
                          className="fh-exec-chip"
                          style={presetAtivo === p.rotulo ? { color: C.gold, borderColor: alfaDe(C.gold, 0.45) } : undefined}>
                          {p.rotulo}
                        </button>
                      ))}
                    </span>
                  }
                />
                <div className="fh-exec-quebras">
                  {d.quebras.filter((q) => q.linhas.length > 0).map((q) => (
                    <Bloco key={q.codigo} titulo={q.nome} sem altura={330}
                      canto={`${d.periodo.de.slice(0, 7)} → ${d.periodo.ate.slice(0, 7)}`}>
                      <Lista
                        linhas={q.linhas.map((l) => ({ rotulo: l.rotulo, valor: l.valor }))}
                        formatar={(v) => valorFmt(card.unidade === "qtd" ? "qtd" : card.razao ? card.unidade : "brl", v)}
                        total={card.razao ? null : q.linhas.reduce((s, l) => s + l.valor, 0)}
                      />
                    </Bloco>
                  ))}
                </div>
                {d.quebras.every((q) => q.linhas.length === 0) && (
                  <div className="fh-exec-vazio">Sem dados no período selecionado.</div>
                )}
              </>
            )}

            {/* ---------- registros ---------- */}
            {d.temTabela && d.colunas && (
              <Bloco
                titulo="Registros que compõem o indicador"
                canto={
                  <a href={urlExportarDetalhe(codigo, periodo.de ?? d.periodo.de.slice(0, 7), periodo.ate ?? d.periodo.ate.slice(0, 7))}
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, color: C.gold, fontWeight: 800, textDecoration: "none" }}>
                    <Download size={12} /> Exportar CSV
                  </a>
                }
                sem
              >
                <Estado carregando={tabela.isLoading} erro={tabela.error} vazio={!tabela.data?.linhas.length}
                  vazioTitulo="Sem registros no período">
                  {tabela.data && (
                    <>
                      <div className="fh-rolagem-x">
                        <table className="fh-exec-tabela">
                          <thead>
                            <tr>{tabela.data.colunas.map((c) => <th key={c.chave}>{c.nome}</th>)}</tr>
                          </thead>
                          <tbody>
                            {tabela.data.linhas.map((l, i) => (
                              <tr key={i}>
                                {tabela.data!.colunas.map((c) => (
                                  <td key={c.chave} style={c.tipo === "brl" || c.tipo === "qtd" ? { fontFamily: GROTESK, whiteSpace: "nowrap" } : undefined}>
                                    {celula(c, l[c.chave])}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 20px", borderTop: `1px solid ${C.hair}`, fontSize: 11.5, color: C.faint }}>
                        <span>
                          {valorFmt("qtd", tabela.data.total)} registros
                          {tabela.data.soma != null && <> · soma {valorFmt(card.unidade === "qtd" ? "qtd" : "brl", tabela.data.soma)}</>}
                        </span>
                        <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                          <button type="button" className="fh-exec-chip" disabled={pagina <= 1}
                            onClick={() => setPagina((p) => p - 1)}>‹ anterior</button>
                          <span>página {tabela.data.pagina} de {Math.max(1, Math.ceil(tabela.data.total / tabela.data.porPagina))}</span>
                          <button type="button" className="fh-exec-chip"
                            disabled={tabela.data.pagina * tabela.data.porPagina >= tabela.data.total}
                            onClick={() => setPagina((p) => p + 1)}>próxima ›</button>
                        </span>
                      </div>
                    </>
                  )}
                </Estado>
              </Bloco>
            )}
          </>
        )}
      </Estado>
    </div>
  );
}
