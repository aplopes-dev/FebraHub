"use client";

/* ============================================================
   HUB EXECUTIVO — visão geral da empresa para a diretoria.

   A pergunta que esta tela responde em segundos: estamos indo bem,
   estamos no ritmo da meta, o que precisa de atenção e onde clicar
   para entender. Todo número vem calculado do backend; aqui é
   apresentação, filtro (na URL) e navegação para o detalhe.
   ============================================================ */

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, Pencil, Printer, RefreshCw, Settings2, Target } from "lucide-react";
import { Bloco } from "@/components/ui/Bloco";
import { Estado } from "@/components/ui/Estado";
import { SecaoTitulo } from "@/components/ui/SecaoTitulo";
import { C, alfaDe } from "@/lib/tema";
import { ehAdmin, usePerfil, useSessao } from "@/hooks/auth";
import {
  useAtualizarDados,
  useFiltrosExecutivo,
  useGravarPreferencias,
  usePreferenciasExecutivo,
  useResumoExecutivo,
} from "@/hooks/executivo";
import { urlExportarResumo } from "@/services/api/executivo";
import type { CardIndicador, PreferenciasHub } from "@/types/executivo";
import { AlertasDestaques } from "./AlertasDestaques";
import { ConsolidadoAnual } from "./ConsolidadoAnual";
import { ExecMedia } from "./ExecMedia";
import { FiltrosExecutivo } from "./FiltrosExecutivo";
import { IndicadoresPorSetor } from "./IndicadoresPorSetor";
import { ResumoCasa } from "./ResumoCasa";
import { RitmoMeta } from "./RitmoMeta";
import { dataBr, mesLabel } from "./formatos";
import { useRitmoMeta } from "@/hooks/executivo";

const HERO_POSTER = "/executivo/exec-hero.png";
const HERO_VIDEO = "/executivo/exec-hero.mp4";

const botaoAcao: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 11px",
  borderRadius: 9, border: `1px solid ${C.cardLine}`, background: "transparent",
  color: C.muted, fontSize: 11.5, fontWeight: 800, cursor: "pointer", textDecoration: "none",
};

/** Aplica preferências: remove ocultos e ordena (favoritos → ordem → catálogo). */
function aplicarPreferencias(cards: CardIndicador[], prefs: PreferenciasHub): CardIndicador[] {
  const ocultos = new Set(prefs.ocultos ?? []);
  const posicao = new Map((prefs.ordem ?? []).map((c, i) => [c, i]));
  const favoritos = new Set(prefs.favoritos ?? []);
  return cards
    .filter((c) => !ocultos.has(c.codigo))
    .sort((a, b) => {
      const favA = favoritos.has(a.codigo) ? 0 : 1;
      const favB = favoritos.has(b.codigo) ? 0 : 1;
      if (favA !== favB) return favA - favB;
      const pa = posicao.get(a.codigo) ?? 10_000 + a.ordem;
      const pb = posicao.get(b.codigo) ?? 10_000 + b.ordem;
      return pa - pb;
    });
}

export function PainelExecutivo() {
  const filtros = useFiltrosExecutivo();
  const resumo = useResumoExecutivo(filtros.mes);
  const prefs = usePreferenciasExecutivo();
  const atualizar = useAtualizarDados();
  const sessao = useSessao();
  const perfil = usePerfil(sessao);
  const admin = !!perfil.data && ehAdmin(perfil.data);

  const [personalizando, setPersonalizando] = useState(false);

  const d = resumo.data;
  const prefsAtivas = useMemo<PreferenciasHub>(
    () => ({ ...(prefs.data?.empresa ?? {}), ...(prefs.data?.minhas ?? {}) }),
    [prefs.data]
  );

  const cardsVisao = useMemo(
    () => (d ? aplicarPreferencias(d.cards.filter((c) => c.naVisaoGeral), prefsAtivas) : []),
    [d, prefsAtivas]
  );

  const candidatosRitmo = useMemo(
    () => (d ? d.cards.filter((c) => c.tipo === "fluxo" && !c.razao) : []),
    [d]
  );
  const [ritmoEscolhido, setRitmoEscolhido] = useState<string | null>(null);
  const codigoRitmo =
    ritmoEscolhido ??
    candidatosRitmo.find((c) => c.meta)?.codigo ??
    candidatosRitmo[0]?.codigo ??
    null;
  const ritmo = useRitmoMeta(codigoRitmo, filtros.mes);
  const cardRitmo = candidatosRitmo.find((c) => c.codigo === codigoRitmo);

  const fontesComProblema = d?.fontes.filter((f) => f.status !== "ok") ?? [];

  const vermelhos = d?.alertas.filter((a) => a.nivel === "vermelho").length ?? 0;

  return (
    <div className="fh-exec">
      <section className="fh-exec-hero" aria-label="Abertura do Hub Executivo">
        <ExecMedia className="fh-exec-hero-media" posterSrc={HERO_POSTER} videoSrc={HERO_VIDEO} />
        <div className="fh-exec-hero-veil" />
        <div className="fh-exec-hero-shine" aria-hidden />
        <div className="fh-exec-hero-conteudo">
          <p className="fh-exec-kicker fh-exec-reveal">Hub Executivo · Febracis</p>
          <h1 className="fh-exec-hero-titulo fh-exec-reveal" style={{ animationDelay: "80ms" }}>
            O retrato da operação<br />
            <span>consolidado</span>
          </h1>
          <p className="fh-exec-hero-sub fh-exec-reveal" style={{ animationDelay: "140ms" }}>
            {d
              ? "Âncoras da casa, alertas reais e ritmo da meta — sem erros."
              : "Carregando o pulso da operação…"}
          </p>
          {d && (
            <div className="fh-exec-hero-chips fh-exec-reveal" style={{ animationDelay: "200ms" }}>
              <span className="fh-exec-pill">{mesLabel(d.referencia.mes)}</span>
              <span className="fh-exec-pill">
                {d.referencia.parcial
                  ? `Dia ${d.referencia.diaAtual}/${d.referencia.diasNoMes}`
                  : "Mês fechado"}
              </span>
              <span className={`fh-exec-pill${vermelhos > 0 ? " fh-exec-pill-alerta" : ""}`}>
                {d.alertas.length > 0
                  ? `${d.alertas.length} atenção${vermelhos ? ` · ${vermelhos} crítico${vermelhos > 1 ? "s" : ""}` : ""}`
                  : "Sem alertas críticos"}
              </span>
              <span className="fh-exec-pill">
                {fontesComProblema.length > 0
                  ? `${fontesComProblema.length} fonte${fontesComProblema.length > 1 ? "s" : ""} pendente${fontesComProblema.length > 1 ? "s" : ""}`
                  : "Fontes em dia"}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* -------- topo: período, comparação e ações -------- */}
      <div className="fh-exec-topo">
        {d && (
          <FiltrosExecutivo
            mes={filtros.mes}
            mesCorrente={d.referencia.mesCorrente.slice(0, 7)}
            mesMinimo="2021-11"
            comparar={filtros.comparar}
            onMes={filtros.setMes}
            onComparar={filtros.setComparar}
          />
        )}
        <div className="fh-exec-acoes">
          <button type="button" style={botaoAcao} className="fh-toque"
            onClick={() => atualizar.mutate()} disabled={atualizar.isPending}
            title="Descarta o cache e recalcula com o dado mais novo">
            <RefreshCw size={13} className={atualizar.isPending ? "girar" : undefined} />
            <span className="fh-sem-celular">Atualizar dados</span>
          </button>
          <a href={urlExportarResumo(filtros.mes ?? undefined)} style={botaoAcao} className="fh-toque"
            title="Baixar o resumo em CSV (abre no Excel)">
            <Download size={13} />
            <span className="fh-sem-celular">CSV</span>
          </a>
          <button type="button" style={botaoAcao} className="fh-toque fh-sem-celular"
            onClick={() => window.print()} title="Imprimir ou salvar em PDF">
            <Printer size={13} />
            PDF
          </button>
          {admin && (
            <Link href="/executivo/metas" style={botaoAcao} className="fh-toque"
              title="Cadastrar e revisar metas">
              <Target size={13} />
              <span className="fh-sem-celular">Metas</span>
            </Link>
          )}
          <button type="button" className="fh-toque"
            style={{ ...botaoAcao, ...(personalizando ? { color: C.gold, borderColor: alfaDe(C.gold, 0.4) } : {}) }}
            onClick={() => setPersonalizando((v) => !v)} title="Personalizar os cards da visão geral">
            <Settings2 size={13} />
            <span className="fh-sem-celular">Personalizar</span>
          </button>
        </div>
      </div>

      <Estado carregando={resumo.isLoading} erro={resumo.error} vazio={!d}>
        {d && (
          <>
            {/* -------- faixa de contexto -------- */}
            <div className="fh-exec-contexto">
              <span>
                <b style={{ color: C.bright }}>{mesLabel(d.referencia.mes)}</b>
                {d.referencia.parcial
                  ? ` · dia ${d.referencia.diaAtual} de ${d.referencia.diasNoMes} — números parciais, comparados ao mesmo período`
                  : " · mês fechado"}
              </span>
              <span>
                {d.alertas.length > 0 ? (
                  <>
                    <b style={{ color: d.alertas.some((a) => a.nivel === "vermelho") ? C.down : C.warn }}>
                      {d.alertas.length} {d.alertas.length === 1 ? "ponto" : "pontos"} de atenção
                    </b>
                    {" · "}
                  </>
                ) : null}
                {fontesComProblema.length > 0 ? (
                  <>{fontesComProblema.length} {fontesComProblema.length === 1 ? "fonte pendente" : "fontes pendentes"}</>
                ) : (
                  "todas as fontes em dia"
                )}
              </span>
            </div>

            {/* -------- personalização -------- */}
            {personalizando && (
              <PainelPersonalizar
                cards={d.cards.filter((c) => c.naVisaoGeral)}
                prefs={prefsAtivas}
                admin={admin}
                aoFechar={() => setPersonalizando(false)}
              />
            )}

            {/* -------- 1. resumo da casa (âncoras) -------- */}
            <ResumoCasa
              cards={d.cards}
              modo={filtros.comparar}
              linkIndicador={filtros.linkIndicador}
            />

            {/* -------- 2. atenção e avanços -------- */}
            <SecaoTitulo titulo="Atenção e avanços" canto="regras sobre números reais — nada é gerado por IA" />
            <AlertasDestaques alertas={d.alertas} destaques={d.destaques} linkIndicador={filtros.linkIndicador} />

            {/* -------- 3. indicadores por setor -------- */}
            <SecaoTitulo
              titulo="Indicadores por setor"
              canto="visão geral agrupada — Personalizar altera o que aparece aqui"
            />
            <IndicadoresPorSetor
              setores={d.setores}
              cards={cardsVisao}
              modo={filtros.comparar}
              linkIndicador={filtros.linkIndicador}
            />

            {/* -------- 4. ritmo da meta -------- */}
            {codigoRitmo && (
              <div style={{ marginTop: 26 }}>
                <Bloco
                  titulo="Ritmo da meta"
                  canto={
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <select value={codigoRitmo} onChange={(e) => setRitmoEscolhido(e.target.value)}
                        className="fh-exec-select" aria-label="Indicador do ritmo">
                        {candidatosRitmo.map((c) => (
                          <option key={c.codigo} value={c.codigo}>{c.curto}</option>
                        ))}
                      </select>
                    </span>
                  }
                >
                  <Estado carregando={ritmo.isLoading} erro={ritmo.error} vazio={!ritmo.data}>
                    {ritmo.data && cardRitmo && (
                      <>
                        {ritmo.data.meta == null && (
                          <div style={{ fontSize: 11.5, color: C.faint, marginBottom: 8 }}>
                            Sem meta definida para {mesLabel(ritmo.data.mes)} — o gráfico mostra o realizado e a projeção.
                            {admin && (
                              <> Cadastre em <Link href="/executivo/metas" style={{ color: C.gold, fontWeight: 800 }}>Metas</Link>.</>
                            )}
                          </div>
                        )}
                        <div className="fh-exec-ritmo-shell">
                          <RitmoMeta dados={ritmo.data} unidade={cardRitmo.unidade} />
                        </div>
                      </>
                    )}
                  </Estado>
                </Bloco>
              </div>
            )}

            {/* -------- 5. consolidado anual -------- */}
            <div style={{ marginTop: 26 }}>
              <ConsolidadoAnual candidatos={candidatosRitmo.concat(d.cards.filter((c) => c.tipo === "fluxo" && c.razao))} />
            </div>

            {/* -------- fontes -------- */}
            <div className="fh-exec-fontes">
              {d.fontes.map((f) => (
                <span key={f.fonte} title={f.rotulo}>
                  {f.nome} · {f.rotulo}
                </span>
              ))}
              <span style={{ opacity: 0.8 }}>gerado {dataBr(d.geradoEm.slice(0, 10))}</span>
            </div>
          </>
        )}
      </Estado>
    </div>
  );
}

/* ------------------- personalização (spec §28) ------------------- */

function PainelPersonalizar({
  cards,
  prefs,
  admin,
  aoFechar,
}: {
  cards: CardIndicador[];
  prefs: PreferenciasHub;
  admin: boolean;
  aoFechar: () => void;
}) {
  const gravar = useGravarPreferencias();
  const ordenados = useMemo(() => aplicarPreferencias(cards, { ...prefs, ocultos: [] }), [cards, prefs]);
  const [ordem, setOrdem] = useState<string[]>(ordenados.map((c) => c.codigo));
  const [ocultos, setOcultos] = useState<Set<string>>(new Set(prefs.ocultos ?? []));

  const mover = (codigo: string, delta: number) => {
    setOrdem((atual) => {
      const i = atual.indexOf(codigo);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= atual.length) return atual;
      const nova = [...atual];
      [nova[i], nova[j]] = [nova[j], nova[i]];
      return nova;
    });
  };

  const salvar = (daEmpresa: boolean) =>
    gravar.mutate(
      { config: { ...prefs, ordem, ocultos: [...ocultos] }, daEmpresa },
      { onSuccess: aoFechar }
    );

  const porCodigo = new Map(cards.map((c) => [c.codigo, c]));

  return (
    <div className="fh-exec-personalizar" role="region" aria-label="Personalizar visão geral">
      <div style={{ fontSize: 12, fontWeight: 800, color: C.bright, marginBottom: 8 }}>
        Personalizar a visão geral
      </div>
      <div style={{ display: "grid", gap: 4 }}>
        {ordem.map((codigo, i) => {
          const c = porCodigo.get(codigo);
          if (!c) return null;
          const oculto = ocultos.has(codigo);
          return (
            <div key={codigo} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 7, flex: 1, minWidth: 0, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={!oculto}
                  onChange={() =>
                    setOcultos((s) => {
                      const n = new Set(s);
                      if (n.has(codigo)) n.delete(codigo);
                      else n.add(codigo);
                      return n;
                    })
                  }
                />
                <span style={{ fontSize: 12, color: oculto ? C.faint : C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.curto}
                </span>
              </label>
              <button type="button" onClick={() => mover(codigo, -1)} disabled={i === 0}
                style={{ ...botaoAcao, padding: "3px 8px" }} aria-label={`Subir ${c.curto}`}>↑</button>
              <button type="button" onClick={() => mover(codigo, 1)} disabled={i === ordem.length - 1}
                style={{ ...botaoAcao, padding: "3px 8px" }} aria-label={`Descer ${c.curto}`}>↓</button>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
        <button type="button" style={{ ...botaoAcao, color: C.gold, borderColor: alfaDe(C.gold, 0.4) }}
          onClick={() => salvar(false)} disabled={gravar.isPending}>
          <Pencil size={12} /> Salvar minha visão
        </button>
        {admin && (
          <button type="button" style={botaoAcao} onClick={() => salvar(true)} disabled={gravar.isPending}>
            Salvar como padrão da empresa
          </button>
        )}
        <button type="button" style={botaoAcao} onClick={aoFechar}>Cancelar</button>
      </div>
    </div>
  );
}
