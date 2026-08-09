"use client";

/* Atenção e avanços — leitura executiva: um impacto em destaque + fila compacta. */

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowUpRight, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { C, GROTESK, alfaDe } from "@/lib/tema";
import type { Alerta, Destaque } from "@/types/executivo";
import { ExecMedia } from "./ExecMedia";

const LIMITE_INICIAL = 3;
const ALERT_POSTER = "/executivo/exec-alert-panel.png";
const ALERT_VIDEO = "/executivo/exec-alert.mp4";

/** Extrai um número de impacto do título (ex.: "alta de 540,1%"). */
function metricDoTitulo(titulo: string): string | null {
  const m = titulo.match(/(-?\d{1,3}(?:\.\d{3})*(?:,\d+)?\s*%|R\$\s*[\d.,]+\s*(?:mi|mil)?)/i);
  return m?.[1]?.replace(/\s+/g, " ") ?? null;
}

function BotaoVerMais({
  aberto,
  ocultos,
  onToggle,
}: {
  aberto: boolean;
  ocultos: number;
  onToggle: () => void;
}) {
  if (ocultos <= 0) return null;
  return (
    <button type="button" onClick={onToggle} className="fh-toque fh-exec-ver-mais">
      {aberto ? (
        <>Mostrar menos <ChevronUp size={13} /></>
      ) : (
        <>Ver todos (+{ocultos}) <ChevronDown size={13} /></>
      )}
    </button>
  );
}

function CardAlertaHero({ a, href }: { a: Alerta; href: string }) {
  const cor = a.nivel === "vermelho" ? C.down : C.warn;
  return (
    <Link href={href} className="fh-exec-flash fh-exec-flash-down fh-exec-reveal" style={{ animationDelay: "60ms" }}>
      <div className="fh-exec-flash-topo">
        <span className="fh-exec-flash-badge" style={{ color: cor, background: alfaDe(cor, 0.16), borderColor: alfaDe(cor, 0.35) }}>
          {a.nivel === "vermelho" ? "Crítico" : "Atenção"}
        </span>
        <span className="fh-exec-lista-setor">{a.setorNome}</span>
      </div>
      <h4 className="fh-exec-flash-titulo">{a.titulo}</h4>
      {a.impacto && (
        <div className="fh-exec-flash-metric" style={{ color: cor, fontFamily: GROTESK }}>
          {a.impacto}
        </div>
      )}
      <p className="fh-exec-flash-texto">{a.situacao}</p>
      {a.acaoSugerida && (
        <p className="fh-exec-flash-acao"><b>Próximo passo:</b> {a.acaoSugerida}</p>
      )}
      <span className="fh-exec-flash-cta">Abrir análise <ArrowUpRight size={14} /></span>
    </Link>
  );
}

function LinhaAlerta({ a, href, i }: { a: Alerta; href: string; i: number }) {
  const cor = a.nivel === "vermelho" ? C.down : C.warn;
  return (
    <Link
      href={href}
      className="fh-exec-linha fh-exec-reveal"
      style={{ animationDelay: `${100 + i * 40}ms` }}
    >
      <div className="fh-exec-linha-corpo">
        <div className="fh-exec-linha-topo">
          <span className="fh-exec-linha-titulo">{a.titulo}</span>
          <span className="fh-exec-lista-setor">{a.setorNome}</span>
        </div>
        {a.impacto ? (
          <div className="fh-exec-linha-metric" style={{ color: cor }}>{a.impacto}</div>
        ) : (
          <div className="fh-exec-linha-sub">{a.situacao}</div>
        )}
      </div>
      <ArrowUpRight size={15} className="fh-exec-linha-seta" />
    </Link>
  );
}

function CardDestaqueHero({ d, href }: { d: Destaque; href: string }) {
  const metric = metricDoTitulo(d.titulo);
  const tituloLimpo = metric
    ? d.titulo.replace(new RegExp(`:?\\s*${metric.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`), "").replace(/:\s*$/, "").trim()
    : d.titulo;

  return (
    <Link href={href} className="fh-exec-flash fh-exec-flash-up fh-exec-reveal" style={{ animationDelay: "60ms" }}>
      <div className="fh-exec-flash-topo">
        <span className="fh-exec-flash-badge" style={{ color: C.up, background: alfaDe(C.up, 0.14), borderColor: alfaDe(C.up, 0.3) }}>
          Avanço
        </span>
        <span className="fh-exec-lista-setor">{d.setorNome}</span>
      </div>
      <h4 className="fh-exec-flash-titulo">{tituloLimpo || d.titulo}</h4>
      {metric && (
        <div className="fh-exec-flash-metric" style={{ color: C.up, fontFamily: GROTESK }}>
          {(() => {
            const queda = d.titulo.toLowerCase().includes("queda");
            if (metric.startsWith("+") || metric.startsWith("-") || queda) return metric;
            if (metric.includes("%")) return `+${metric}`;
            return metric;
          })()}
        </div>
      )}
      <p className="fh-exec-flash-texto">{d.frase}</p>
      <span className="fh-exec-flash-cta">Abrir análise <ArrowUpRight size={14} /></span>
    </Link>
  );
}

function LinhaDestaque({ d, href, i }: { d: Destaque; href: string; i: number }) {
  const metric = metricDoTitulo(d.titulo);
  return (
    <Link
      href={href}
      className="fh-exec-linha fh-exec-reveal"
      style={{ animationDelay: `${100 + i * 40}ms` }}
    >
      <div className="fh-exec-linha-corpo">
        <div className="fh-exec-linha-topo">
          <span className="fh-exec-linha-titulo">{d.titulo}</span>
          <span className="fh-exec-lista-setor">{d.setorNome}</span>
        </div>
        {metric ? (
          <div className="fh-exec-linha-metric" style={{ color: C.up }}>{metric}</div>
        ) : (
          <div className="fh-exec-linha-sub">{d.frase}</div>
        )}
      </div>
      <ArrowUpRight size={15} className="fh-exec-linha-seta" />
    </Link>
  );
}

export function AlertasDestaques({
  alertas,
  destaques,
  linkIndicador,
}: {
  alertas: Alerta[];
  destaques: Destaque[];
  linkIndicador: (codigo: string) => string;
}) {
  const [verTodosAlertas, setVerTodosAlertas] = useState(false);
  const [verTodosDestaques, setVerTodosDestaques] = useState(false);

  const alertaHero = alertas[0];
  const alertasFila = alertas.slice(1);
  const alertasVisiveis = verTodosAlertas ? alertasFila : alertasFila.slice(0, LIMITE_INICIAL);

  const destaqueHero = destaques[0];
  const destaquesFila = destaques.slice(1);
  const destaquesVisiveis = verTodosDestaques ? destaquesFila : destaquesFila.slice(0, LIMITE_INICIAL);

  return (
    <div className="fh-exec-duplo fh-exec-listas">
      <section className="fh-exec-lista-painel fh-exec-lista-painel-down" aria-label="Pontos que precisam de atenção">
        <ExecMedia className="fh-exec-lista-fundo" posterSrc={ALERT_POSTER} videoSrc={ALERT_VIDEO} />
        <div className="fh-exec-lista-cabeca">
          <AlertTriangle size={16} style={{ color: C.warn }} />
          <h3>Pontos que precisam de atenção</h3>
          <span>{alertas.length}</span>
        </div>
        {alertas.length === 0 ? (
          <div className="fh-exec-vazio">Nenhum desvio relevante identificado nas regras de acompanhamento.</div>
        ) : (
          <>
            {alertaHero && (
              <CardAlertaHero a={alertaHero} href={linkIndicador(alertaHero.indicador)} />
            )}
            {alertasVisiveis.length > 0 && (
              <div className="fh-exec-lista-stack">
                {alertasVisiveis.map((a, i) => (
                  <LinhaAlerta key={a.id} a={a} href={linkIndicador(a.indicador)} i={i} />
                ))}
              </div>
            )}
            <BotaoVerMais
              aberto={verTodosAlertas}
              ocultos={alertasFila.length - LIMITE_INICIAL}
              onToggle={() => setVerTodosAlertas((v) => !v)}
            />
          </>
        )}
      </section>

      <section className="fh-exec-lista-painel fh-exec-lista-painel-up" aria-label="Principais avanços">
        <ExecMedia className="fh-exec-lista-fundo" posterSrc={ALERT_POSTER} videoSrc={ALERT_VIDEO} />
        <div className="fh-exec-lista-cabeca">
          <Sparkles size={16} style={{ color: C.up }} />
          <h3>Principais avanços</h3>
          <span>{destaques.length}</span>
        </div>
        {destaques.length === 0 ? (
          <div className="fh-exec-vazio">Sem destaques positivos no recorte atual.</div>
        ) : (
          <>
            {destaqueHero && (
              <CardDestaqueHero d={destaqueHero} href={linkIndicador(destaqueHero.indicador)} />
            )}
            {destaquesVisiveis.length > 0 && (
              <div className="fh-exec-lista-stack">
                {destaquesVisiveis.map((d, i) => (
                  <LinhaDestaque
                    key={`${d.indicador}:${d.titulo}`}
                    d={d}
                    href={linkIndicador(d.indicador)}
                    i={i}
                  />
                ))}
              </div>
            )}
            <BotaoVerMais
              aberto={verTodosDestaques}
              ocultos={destaquesFila.length - LIMITE_INICIAL}
              onToggle={() => setVerTodosDestaques((v) => !v)}
            />
          </>
        )}
      </section>
    </div>
  );
}

export const CorAlfa = alfaDe;
