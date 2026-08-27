"use client";

/* Comparativo anual interativo — barras por ano no consolidado. */

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { C } from "@/lib/tema";
import { compacto } from "@/lib/formato";
import type { Unidade } from "@/types/executivo";
import { pctFmt, valorFmt } from "../formatos";
import { TipLinha, TooltipExec } from "./TooltipExec";

type LinhaAno = {
  ano: number;
  total: number;
  completo: boolean;
  mesesComDado: number;
  variacaoAnoAnterior: number | null;
  variacaoPeriodoEquivalente: number | null;
};

export function GraficoAnosBarras({
  linhas,
  unidade,
  anoFoco,
  onAno,
}: {
  linhas: LinhaAno[];
  unidade: Unidade;
  anoFoco: number | null;
  onAno: (ano: number) => void;
}) {
  if (linhas.length === 0) return null;

  const dados = [...linhas].reverse().map((l) => ({
    ...l,
    rotulo: l.completo ? String(l.ano) : `${l.ano}·${l.mesesComDado}m`,
    varMostrar: l.completo ? l.variacaoAnoAnterior : l.variacaoPeriodoEquivalente,
  }));

  return (
    <div className="fh-exec-chart-wrap">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={dados} margin={{ top: 12, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid stroke="rgb(var(--sup-rgb) / 0.08)" vertical={false} />
          <XAxis
            dataKey="rotulo"
            tick={{ fill: "var(--faint)", fontSize: 11, fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "var(--faint)", fontSize: 11, fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
            width={48}
            tickFormatter={(v: number) => compacto(v)}
          />
          <Tooltip
            cursor={{ fill: "rgb(var(--gold-rgb) / 0.08)" }}
            content={({ active, payload }) => {
              const p = payload?.[0]?.payload as (typeof dados)[number] | undefined;
              if (!p) return null;
              return (
                <TooltipExec active={active} label={p.ano}>
                  <TipLinha cor={C.gold} nome="Total" valor={valorFmt(unidade, p.total)} />
                  {p.varMostrar != null && (
                    <TipLinha
                      cor={p.varMostrar >= 0 ? C.up : C.down}
                      nome={p.completo ? "vs. ano anterior" : "mesmo período"}
                      valor={`${p.varMostrar >= 0 ? "+" : "−"}${pctFmt(Math.abs(p.varMostrar))}`}
                    />
                  )}
                </TooltipExec>
              );
            }}
          />
          <Bar
            dataKey="total"
            radius={[8, 8, 4, 4]}
            maxBarSize={44}
            cursor="pointer"
            isAnimationActive
            animationDuration={650}
            onClick={(d) => {
              const ano = (d as { ano?: number })?.ano;
              if (ano != null) onAno(ano);
            }}
          >
            {dados.map((d) => (
              <Cell
                key={d.ano}
                fill={
                  (anoFoco ?? dados[dados.length - 1]?.ano) === d.ano
                    ? "var(--gold)"
                    : "color-mix(in srgb, var(--gold) 45%, var(--muted))"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
