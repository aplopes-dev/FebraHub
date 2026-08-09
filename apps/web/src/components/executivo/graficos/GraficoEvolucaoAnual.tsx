"use client";

/* Evolução mensal interativa (Recharts) — consolidado anual do Hub Executivo. */

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { C } from "@/lib/tema";
import { compacto } from "@/lib/formato";
import type { Unidade } from "@/types/executivo";
import { mesCurtoAno, valorFmt } from "../formatos";
import { TipLinha, TooltipExec } from "./TooltipExec";

type Ponto = { mes: string; valor: number; parcial?: boolean };

export function GraficoEvolucaoAnual({
  serie,
  unidade,
  nome,
}: {
  serie: Ponto[];
  unidade: Unidade;
  nome: string;
}) {
  if (serie.length < 2) return null;

  const dados = serie.map((p) => ({
    ...p,
    rotulo: mesCurtoAno(p.mes),
  }));

  return (
    <div className="fh-exec-chart-wrap">
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={dados} margin={{ top: 18, right: 16, left: 4, bottom: 4 }}>
          <defs>
            <linearGradient id="fhExecAreaGold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgb(var(--sup-rgb) / 0.08)" vertical={false} />
          <XAxis
            dataKey="rotulo"
            tick={{ fill: "var(--faint)", fontSize: 11, fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
            minTickGap={28}
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
              const p = payload?.[0]?.payload as (Ponto & { rotulo: string }) | undefined;
              if (!p) return null;
              return (
                <TooltipExec active={active} label={label}>
                  <TipLinha
                    cor={C.gold}
                    nome={p.parcial ? `${nome} (parcial)` : nome}
                    valor={valorFmt(unidade, p.valor)}
                  />
                </TooltipExec>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="valor"
            stroke="var(--gold)"
            strokeWidth={2.4}
            fill="url(#fhExecAreaGold)"
            activeDot={{ r: 5, fill: "var(--gold)", stroke: "var(--void)", strokeWidth: 2 }}
            dot={false}
            isAnimationActive
            animationDuration={700}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
