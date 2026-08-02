"use client";

/* ============================================================
   O card executivo (spec §5): valor, meta, % da meta, esperado até
   hoje, comparação escolhida, tendência, projeção, status com TEXTO
   (nunca só cor) e a qualidade do dado. O card inteiro é um link para
   a tela analítica, que herda os filtros pela URL.
   ============================================================ */

import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { Spark } from "@/components/graficos/Spark";
import { C, GROTESK, alfaDe } from "@/lib/tema";
import type { CardIndicador as Card, Comparacao, ModoComparacao } from "@/types/executivo";
import { corStatus, dataBr, deltaBom, mesCurtoAno, pctFmt, rotuloConfianca, valorFmt } from "./formatos";

const ROTULO_MODO: Record<ModoComparacao, string> = {
  mes_anterior: "vs. mês anterior",
  ano_anterior: "vs. mesmo mês do ano anterior",
  media3: "vs. média dos últimos 3 meses",
  media6: "vs. média dos últimos 6 meses",
  media12: "vs. média dos últimos 12 meses",
  melhor: "vs. melhor mês",
};

/** A comparação escolhida no filtro, extraída do card. */
function comparacaoDe(card: Card, modo: ModoComparacao): { cmp: Comparacao; rotulo: string } | null {
  const c = card.comparacoes;
  if (!c || card.valor == null) return null;
  if (modo === "melhor") {
    if (!c.melhorMes) return null;
    const base = c.melhorMes.valor;
    return {
      cmp: { base, delta: card.valor - base, pct: base ? ((card.valor - base) / Math.abs(base)) * 100 : null, parcial: false },
      rotulo: `vs. melhor mês (${mesCurtoAno(c.melhorMes.mes)})`,
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
  const sufixo = cmp.parcial ? " · mesmo período" : "";
  return { cmp, rotulo: `${ROTULO_MODO[modo]}${sufixo}` };
}

function LinhaComparacao({ card, cmp, rotulo }: { card: Card; cmp: Comparacao; rotulo: string }) {
  const bom = deltaBom(card, cmp.delta);
  const cor = cmp.delta === 0 ? C.faint : bom ? C.up : C.down;
  const Seta = cmp.delta === 0 ? ArrowRight : cmp.delta > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
      <Seta size={13} style={{ color: cor, flexShrink: 0 }} />
      <span style={{ fontSize: 11.5, fontWeight: 800, color: cor, flexShrink: 0 }}>
        {cmp.pct != null ? pctFmt(cmp.pct) : valorFmt(card.unidade, Math.abs(cmp.delta))}
      </span>
      <span
        style={{ fontSize: 11, color: C.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        title={`${rotulo} (${valorFmt(card.unidade, cmp.base, false)})`}
      >
        {rotulo}
      </span>
    </div>
  );
}

export function CardExecutivo({
  card,
  modo,
  href,
}: {
  card: Card;
  modo: ModoComparacao;
  href: string;
}) {
  const cor = corStatus(card.status.nivel);
  const principal = comparacaoDe(card, modo);
  // A secundária mostra o outro ângulo clássico: se a principal é o mês
  // anterior, mostra o ano anterior — e vice-versa.
  const secundaria =
    modo === "ano_anterior"
      ? comparacaoDe(card, "mes_anterior")
      : card.comparacoes?.anoAnterior
        ? comparacaoDe(card, "ano_anterior")
        : null;

  const dentroDaMeta = card.pctMeta != null && card.meta != null;
  const pctBarra = dentroDaMeta ? Math.min(card.pctMeta!, 130) : 0;

  return (
    <Link
      href={href}
      className="fh-exec-card"
      aria-label={`${card.nome} — abrir análise`}
      style={{ borderColor: alfaDe(cor, card.status.nivel === "neutro" || card.status.nivel === "cinza" ? 0.18 : 0.34) }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontSize: 11.5, color: C.muted, fontWeight: 700, letterSpacing: ".2px", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={card.nome}>
          {card.curto}
        </span>
        <span
          className="fh-exec-badge"
          style={{ color: cor, background: alfaDe(cor, 0.12), borderColor: alfaDe(cor, 0.25) }}
        >
          {card.status.rotulo}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 8, minWidth: 0 }}>
        <span style={{ fontFamily: GROTESK, fontSize: 22, fontWeight: 700, letterSpacing: "-.5px", color: C.text, whiteSpace: "nowrap" }}>
          {valorFmt(card.unidade, card.valor)}
        </span>
        {card.parcial && (
          <span style={{ fontSize: 10.5, fontWeight: 700, color: C.warn, whiteSpace: "nowrap" }}>parcial</span>
        )}
        {card.tipo === "estado" && card.referencia && (
          <span style={{ fontSize: 10.5, color: C.faint, whiteSpace: "nowrap" }}>em {dataBr(card.referencia)}</span>
        )}
      </div>

      {/* Meta e esperado — ou a ausência honesta deles */}
      {dentroDaMeta ? (
        <div style={{ marginTop: 9 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 11, color: C.faint }}>
            <span>
              Meta {valorFmt(card.unidade, card.meta!.valor)}
              {card.meta!.origem === "loja" ? " · planilha" : ""}
            </span>
            <span style={{ fontWeight: 800, color: C.muted }}>{pctFmt(card.pctMeta, 0)}</span>
          </div>
          <div style={{ height: 4, borderRadius: 4, background: alfaDe(C.faint, 0.15), marginTop: 4, overflow: "hidden" }}>
            <div style={{ width: `${(pctBarra / 130) * 100}%`, height: "100%", borderRadius: 4, background: cor }} />
          </div>
          {card.parcial && card.esperado != null && (
            <div style={{ fontSize: 11, color: C.faint, marginTop: 5 }}>
              Esperado até hoje: <b style={{ color: C.muted }}>{valorFmt(card.unidade, card.esperado)}</b>
              {card.desvioEsperado != null && card.desvioEsperado !== 0 && (
                <b style={{ color: deltaBom(card, card.desvioEsperado) ? C.up : C.down }}>
                  {" "}({card.desvioEsperado > 0 ? "+" : "−"}{valorFmt(card.unidade, Math.abs(card.desvioEsperado))})
                </b>
              )}
            </div>
          )}
        </div>
      ) : (
        card.direcao !== "neutra" &&
        card.tipo !== "estado" && (
          <div style={{ fontSize: 11, color: C.faint, marginTop: 9 }}>
            {card.status.nivel === "cinza" ? card.status.rotulo : "Sem meta definida"}
          </div>
        )
      )}

      {/* Comparações + spark */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10, marginTop: 10 }}>
        <div style={{ display: "grid", gap: 4, minWidth: 0, flex: 1 }}>
          {principal ? (
            <LinhaComparacao card={card} cmp={principal.cmp} rotulo={principal.rotulo} />
          ) : (
            card.tipo === "fluxo" && <span style={{ fontSize: 11, color: C.faint }}>Sem base de comparação</span>
          )}
          {secundaria && modo !== "ano_anterior" && secundaria.rotulo !== principal?.rotulo && (
            <LinhaComparacao card={card} cmp={secundaria.cmp} rotulo={secundaria.rotulo} />
          )}
        </div>
        {card.serie && card.serie.length >= 3 && (
          <Spark serie={card.serie.map((p) => ({ valor: p.valor }))} cor={cor} />
        )}
      </div>

      {/* Projeção */}
      {card.projecao && (
        <div style={{ fontSize: 11, color: C.faint, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.hair}` }}>
          Projeção do mês: <b style={{ color: C.muted }}>{valorFmt(card.unidade, card.projecao.central)}</b>
          {card.meta && card.meta.valor > 0 && (
            <> · {pctFmt((card.projecao.central / card.meta.valor) * 100, 0)} da meta</>
          )}
          <span style={{ opacity: 0.85 }}> · {rotuloConfianca(card.projecao.confianca)}</span>
        </div>
      )}
      {!card.projecao && card.parcial && !card.razao && (
        <div style={{ fontSize: 10.5, color: C.faint, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.hair}` }}>
          Projeção disponível a partir do dia 3 do mês.
        </div>
      )}

      {/* Qualidade do dado */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
        <span
          style={{
            width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
            background: card.qualidade.nivel === "ok" ? C.up : card.qualidade.nivel === "atencao" ? C.warn : C.down,
          }}
        />
        <span style={{ fontSize: 10.5, color: C.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={`${card.qualidade.fonteRotulo}: ${card.qualidade.rotulo}`}>
          {card.qualidade.fonteRotulo} · {card.qualidade.rotulo}
        </span>
      </div>
    </Link>
  );
}
