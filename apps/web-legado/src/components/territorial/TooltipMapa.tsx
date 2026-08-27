"use client";

/* Tooltip do mapa — porte de MapTooltip do hub: 264px, compacto, dentro da
   área visível, sem bloquear interação. */

import { NICHE_MAP, isNicheId } from "@/lib/territorial/nichos";
import {
  CONNECTION_TYPE_LABELS,
  REVENUE_RANGE_MAP,
  STATUS_LABELS,
  type CompanyConnection,
  type MapPoint,
} from "@/lib/territorial/tipos";
import { formatInt } from "@/lib/territorial/formato";

export type DadosTooltip =
  | { kind: "ponto"; point: MapPoint }
  | { kind: "arco"; connection: CompanyConnection; sourceName: string; targetName: string };

interface TooltipMapaProps {
  x: number;
  y: number;
  larguraContainer: number;
  alturaContainer: number;
  dados: DadosTooltip;
}

export function TooltipMapa({ x, y, larguraContainer, alturaContainer, dados }: TooltipMapaProps) {
  const W = 264;
  const H = dados.kind === "ponto" ? 150 : 72;
  const left = Math.min(Math.max(8, x + 14), Math.max(8, larguraContainer - W - 8));
  const top = Math.min(Math.max(8, y + 14), Math.max(8, alturaContainer - H - 8));

  return (
    <div role="tooltip" className="tio-mapa-tooltip tio-glass-strong" style={{ left, top }}>
      {dados.kind === "ponto" ? <TooltipPonto point={dados.point} /> : null}
      {dados.kind === "arco" ? (
        <div style={{ display: "grid", gap: 4 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              color: "var(--accent-2)",
            }}
          >
            {CONNECTION_TYPE_LABELS[dados.connection.type]}
          </div>
          <div style={{ color: "var(--ink)" }}>
            {dados.sourceName} <span style={{ color: "var(--ink-faint)" }}>↔</span> {dados.targetName}
          </div>
          {dados.connection.metadata.label ? (
            <div style={{ fontSize: 11, color: "var(--ink-faint)" }}>
              {dados.connection.metadata.label}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function TooltipPonto({ point }: { point: MapPoint }) {
  const nicho = isNicheId(point.nicheId) ? NICHE_MAP[point.nicheId] : null;
  const Icone = nicho?.icon;
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <span
          className="tio-display tio-truncar"
          // minWidth:0 é o que FALTAVA: um flex item com texto nowrap não
          // encolhe abaixo do próprio min-content (a largura total do texto)
          // a menos que isto seja zerado — sem ele o título empurrava o chip
          // pra fora da largura fixa do card em vez de truncar com "…".
          style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)", minWidth: 0 }}
        >
          {point.name}
        </span>
        {nicho ? (
          <span
            className="tio-pill-nicho"
            style={{ borderColor: nicho.color, fontSize: 10.5, flexShrink: 0 }}
          >
            {Icone ? <Icone size={11} aria-hidden /> : null}
            {nicho.name}
          </span>
        ) : null}
      </div>
      <div style={{ color: "var(--ink-dim)" }}>
        {point.city} · {point.state}
        <span style={{ margin: "0 6px", color: "var(--ink-faint)" }}>•</span>
        {STATUS_LABELS[point.status] ?? point.status}
      </div>
      <dl
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "2px 12px",
          fontSize: 12,
          margin: 0,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <dt style={{ color: "var(--ink-faint)" }}>Faixa</dt>
          <dd className="tio-truncar" style={{ margin: 0, color: "var(--ink)" }}>
            {REVENUE_RANGE_MAP[point.revenueRangeId]?.label ?? "—"}
          </dd>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <dt style={{ color: "var(--ink-faint)" }}>Sócios</dt>
          <dd className="tio-tabular" style={{ margin: 0, color: "var(--ink)" }}>
            {point.partnersCount}
          </dd>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <dt style={{ color: "var(--ink-faint)" }}>Funcionários</dt>
          <dd className="tio-tabular" style={{ margin: 0, color: "var(--ink)" }}>
            {formatInt(point.employeeCount)}
          </dd>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <dt style={{ color: "var(--ink-faint)" }}>Score</dt>
          <dd className="tio-tabular" style={{ margin: 0, color: "var(--ink)" }}>
            {point.score}
          </dd>
        </div>
      </dl>
      <div
        style={{
          borderTop: "1px solid color-mix(in srgb, var(--line) 60%, transparent)",
          paddingTop: 6,
          fontSize: 11,
          fontWeight: 500,
          color: "var(--accent-2)",
        }}
      >
        Clique para ver detalhes
      </div>
    </div>
  );
}
