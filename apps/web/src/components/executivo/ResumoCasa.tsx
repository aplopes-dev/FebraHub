"use client";

/* Faixa-âncora do Hub Executivo — bento dramático no primeiro viewport. */

import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { C, GROTESK, alfaDe } from "@/lib/tema";
import type { CardIndicador, Comparacao, ModoComparacao } from "@/types/executivo";
import { corStatus, deltaBom, pctFmt, valorFmt } from "./formatos";

/** Ordem fixa do retrato da casa — Personalizar não altera esta lista. */
export const ANCORAS_CASA = [
  "receita_cursos",
  "vendas_cursos",
  "matriculas",
  "inadimplencia",
  "receita_loja",
] as const;

function comparacaoPrincipal(
  card: CardIndicador,
  modo: ModoComparacao,
): { cmp: Comparacao; rotuloCurto: string } | null {
  const c = card.comparacoes;
  if (!c || card.valor == null) return null;
  if (modo === "melhor") {
    if (!c.melhorMes) return null;
    const base = c.melhorMes.valor;
    return {
      cmp: {
        base,
        delta: card.valor - base,
        pct: base ? ((card.valor - base) / Math.abs(base)) * 100 : null,
        parcial: false,
      },
      rotuloCurto: "vs. melhor",
    };
  }
  const mapa: Record<Exclude<ModoComparacao, "melhor">, Comparacao | null> = {
    mes_anterior: c.mesAnterior,
    ano_anterior: c.anoAnterior,
    media3: c.media3,
    media6: c.media6,
    media12: c.media12,
  };
  const cmp = mapa[modo];
  if (!cmp) return null;
  const rotuloCurto =
    modo === "mes_anterior" ? "vs. ant." :
    modo === "ano_anterior" ? "vs. ano" :
    modo === "media3" ? "vs. méd.3" :
    modo === "media6" ? "vs. méd.6" :
    "vs. méd.12";
  return { cmp, rotuloCurto };
}

function AncoraCard({
  card,
  modo,
  href,
  destaque,
  delay,
}: {
  card: CardIndicador;
  modo: ModoComparacao;
  href: string;
  destaque?: boolean;
  delay: number;
}) {
  const cor = corStatus(card.status.nivel);
  const principal = comparacaoPrincipal(card, modo);
  const bom = principal ? deltaBom(card, principal.cmp.delta) : null;
  const corDelta =
    !principal || principal.cmp.delta === 0 ? C.faint : bom ? C.up : C.down;
  const Seta =
    !principal || principal.cmp.delta === 0
      ? ArrowRight
      : principal.cmp.delta > 0
        ? ArrowUpRight
        : ArrowDownRight;

  return (
    <Link
      href={href}
      className={`fh-exec-ancora fh-exec-reveal${destaque ? " fh-exec-ancora-hero" : ""}`}
      aria-label={`${card.nome} — abrir análise`}
      style={{
        animationDelay: `${delay}ms`,
        borderColor: alfaDe(
          destaque ? C.gold : cor,
          destaque ? 0.35 : card.status.nivel === "neutro" || card.status.nivel === "cinza" ? 0.18 : 0.34,
        ),
      }}
    >
      <span className="fh-exec-ancora-tex" aria-hidden />
      <div className="fh-exec-ancora-topo">
        <span className="fh-exec-ancora-label" title={card.nome}>
          {card.curto}
        </span>
        <span className="fh-exec-badge">
          {card.status.rotulo}
        </span>
      </div>

      <div
        className="fh-exec-ancora-valor"
        style={{
          fontFamily: GROTESK,
          fontSize: destaque ? 42 : 24,
          fontWeight: 700,
          letterSpacing: "-.8px",
          color: destaque ? C.gold : C.bright,
          marginTop: destaque ? 18 : 10,
          lineHeight: 1.05,
        }}
      >
        {valorFmt(card.unidade, card.valor)}
        {card.parcial && (
          <span style={{ fontSize: destaque ? 13 : 11, fontWeight: 700, color: C.warn, marginLeft: 8 }}>
            parcial
          </span>
        )}
      </div>

      {principal ? (
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: destaque ? 14 : 10, minWidth: 0 }}>
          <Seta size={destaque ? 16 : 13} style={{ color: corDelta, flexShrink: 0 }} />
          <span style={{ fontSize: destaque ? 14 : 12, fontWeight: 800, color: corDelta }}>
            {principal.cmp.pct != null
              ? pctFmt(principal.cmp.pct)
              : valorFmt(card.unidade, Math.abs(principal.cmp.delta))}
          </span>
          <span style={{ fontSize: 11.5, color: C.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {principal.rotuloCurto}
          </span>
        </div>
      ) : (
        <div style={{ fontSize: 11.5, color: C.faint, marginTop: 10 }}>{card.setorNome}</div>
      )}

      {destaque && (
        <div className="fh-exec-ancora-cta">Abrir análise →</div>
      )}
    </Link>
  );
}

export function ResumoCasa({
  cards,
  modo,
  linkIndicador,
}: {
  cards: CardIndicador[];
  modo: ModoComparacao;
  linkIndicador: (codigo: string) => string;
}) {
  const porCodigo = new Map(cards.map((c) => [c.codigo, c]));
  const ancoras = ANCORAS_CASA.map((cod) => porCodigo.get(cod)).filter(
    (c): c is CardIndicador => !!c,
  );

  if (ancoras.length === 0) return null;

  const [principal, ...resto] = ancoras;

  return (
    <section className="fh-exec-resumo" aria-label="Resumo da casa">
      <div className="fh-exec-resumo-cabeca">
        <div>
          <p className="fh-exec-kicker">Visão da diretoria</p>
          <h2 className="fh-exec-resumo-titulo">Resumo da casa</h2>
        </div>
        <span className="fh-exec-resumo-dica">Os números que importam antes do detalhe</span>
      </div>

      <div className="fh-exec-bento">
        <AncoraCard
          card={principal}
          modo={modo}
          href={linkIndicador(principal.codigo)}
          destaque
          delay={40}
        />
        <div className="fh-exec-bento-lado">
          {resto.map((card, i) => (
            <AncoraCard
              key={card.codigo}
              card={card}
              modo={modo}
              href={linkIndicador(card.codigo)}
              delay={90 + i * 55}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
