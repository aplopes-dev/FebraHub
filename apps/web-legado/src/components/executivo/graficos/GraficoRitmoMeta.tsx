"use client";

/* Ritmo da meta interativo — realizado × esperado × projeção (Recharts). */

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ARRED_META, C } from "@/lib/tema";
import { compacto } from "@/lib/formato";
import type { RitmoMeta as Dados, Unidade } from "@/types/executivo";
import { valorFmt } from "../formatos";
import { TipLinha, TooltipExec } from "./TooltipExec";

function diaCurto(iso: string): string {
  // "2026-08-08" → "8"
  const m = iso.match(/-(\d{2})$/);
  return m ? String(Number(m[1])) : iso.slice(-2);
}

export function GraficoRitmoMeta({ dados, unidade }: { dados: Dados; unidade: Unidade }) {
  if (!dados.pontos.length) return null;

  const rows = dados.pontos.map((p) => {
    const faixaMin = p.faixaMin;
    const faixaMax = p.faixaMax;
    const faixaRange =
      faixaMin != null && faixaMax != null ? Math.max(0, faixaMax - faixaMin) : null;
    return {
      dia: diaCurto(p.dia),
      diaIso: p.dia,
      realizado: p.realizado,
      esperado: p.esperado,
      projetado: p.projetado,
      faixaMin,
      faixaRange,
    };
  });

  return (
    <div className="fh-exec-chart-wrap fh-exec-chart-wrap-ritmo">
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={rows} margin={{ top: 16, right: 18, left: 2, bottom: 4 }}>
          <defs>
            <linearGradient id="fhExecRitmoFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgb(var(--sup-rgb) / 0.08)" vertical={false} />
          <XAxis
            dataKey="dia"
            tick={{ fill: "var(--faint)", fontSize: 11, fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={18}
          />
          <YAxis
            tick={{ fill: "var(--faint)", fontSize: 11, fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
            width={52}
            tickFormatter={(v: number) => compacto(v)}
          />
          <Tooltip
            cursor={{ stroke: "var(--gold)", strokeWidth: 1, strokeDasharray: "4 4" }}
            content={({ active, payload, label }) => {
              const p = payload?.[0]?.payload as (typeof rows)[number] | undefined;
              if (!p) return null;
              return (
                <TooltipExec active={active} label={`Dia ${label}`}>
                  {p.realizado != null && (
                    <TipLinha cor={C.gold} nome="Realizado" valor={valorFmt(unidade, p.realizado)} />
                  )}
                  {p.esperado != null && (
                    <TipLinha cor={ARRED_META} nome="Esperado" valor={valorFmt(unidade, p.esperado)} />
                  )}
                  {p.projetado != null && (
                    <TipLinha
                      cor={C.muted}
                      nome="Projeção"
                      valor={valorFmt(unidade, p.projetado)}
                    />
                  )}
                </TooltipExec>
              );
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={28}
            formatter={(v) => <span style={{ color: "var(--muted)", fontSize: 11, fontWeight: 700 }}>{v}</span>}
          />

          {/* faixa provável: base transparente + faixa empilhada */}
          <Area
            type="monotone"
            dataKey="faixaMin"
            stackId="faixa"
            stroke="none"
            fill="transparent"
            legendType="none"
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="faixaRange"
            name="Faixa provável"
            stackId="faixa"
            stroke="none"
            fill="var(--gold)"
            fillOpacity={0.14}
            legendType="square"
            isAnimationActive
          />

          {dados.meta != null && (
            <ReferenceLine
              y={dados.meta}
              stroke="var(--warn)"
              strokeDasharray="3 4"
              label={{
                value: `meta ${valorFmt(unidade, dados.meta)}`,
                position: "insideTopRight",
                fill: "var(--warn)",
                fontSize: 10,
                fontWeight: 700,
              }}
            />
          )}

          {dados.hoje && (
            <ReferenceLine
              x={diaCurto(dados.hoje)}
              stroke="var(--faint)"
              strokeDasharray="3 3"
              label={{ value: "hoje", position: "insideTopLeft", fill: "var(--faint)", fontSize: 10 }}
            />
          )}

          <Line
            type="monotone"
            dataKey="esperado"
            name="Esperado"
            stroke={ARRED_META}
            strokeWidth={1.8}
            strokeDasharray="6 4"
            dot={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="projetado"
            name="Projeção"
            stroke="var(--muted)"
            strokeWidth={1.6}
            strokeDasharray="2 5"
            dot={false}
            connectNulls
          />
          <Area
            type="monotone"
            dataKey="realizado"
            name="Realizado"
            stroke="var(--gold)"
            strokeWidth={2.6}
            fill="url(#fhExecRitmoFill)"
            dot={false}
            activeDot={{ r: 5, fill: "var(--gold)", stroke: "var(--void)", strokeWidth: 2 }}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
      {dados.reguaEsperado && dados.reguaEsperado !== "historico" && (
        <div className="fh-exec-chart-nota">
          Régua: {dados.reguaEsperado === "dias_uteis" ? "dias úteis (histórico diário insuficiente)" : "linear"}
        </div>
      )}
    </div>
  );
}
