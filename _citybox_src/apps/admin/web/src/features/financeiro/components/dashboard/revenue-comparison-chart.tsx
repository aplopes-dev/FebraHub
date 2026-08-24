"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, Line, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@citybox/ui/atoms";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@citybox/ui/atoms";
import { cn } from "@citybox/ui";
import { useBillingKpis } from "../../hooks/use-finance-queries";
import { DASHBOARD_CARD, DASHBOARD_CARD_INNER } from "./dashboard-ui";

const chartConfig: ChartConfig = {
  realizada: {
    label: "Receita Realizada",
    color: "var(--orbitly-teal)",
  },
  prevista: {
    label: "Receita Prevista",
    color: "var(--orbitly-ink)",
  },
};

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(value);
}

function formatCompactBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(value);
}

export function RevenueComparisonChart() {
  const searchParams = useSearchParams();
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;

  const { data: kpis, isLoading } = useBillingKpis({
    startDate,
    endDate,
    enabled: !!startDate && !!endDate,
  });

  const chartData = useMemo(() => {
    return kpis?.revenueHistory ?? [];
  }, [kpis]);

  const { avgMonthly, avgYearly } = useMemo(() => {
    if (chartData.length === 0) return { avgMonthly: 0, avgYearly: 0 };
    const totalRealizada = chartData.reduce((sum, d) => sum + d.realizada, 0);
    const avgM = totalRealizada / chartData.length;
    return {
      avgMonthly: avgM,
      avgYearly: totalRealizada,
    };
  }, [chartData]);

  if (isLoading) {
    return <div className="h-[360px] bg-muted/40 animate-pulse rounded-lg" />;
  }

  return (
    <Card className={DASHBOARD_CARD}>
      <CardHeader className="border-b border-border/40">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-[var(--orbitly-ink)]">
              Receita
            </CardTitle>
            <p className="text-sm text-foreground/50">Prevista vs realizada — 12 meses</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className={cn(DASHBOARD_CARD_INNER, "px-3 py-2")}>
              <p className="text-[10px] font-medium uppercase tracking-wide text-foreground/45">
                Média anual
              </p>
              <p className="text-sm font-semibold tabular-nums text-[var(--orbitly-ink)]">
                {formatBRL(avgYearly)}
              </p>
            </div>
            <div className={cn(DASHBOARD_CARD_INNER, "px-3 py-2")}>
              <p className="text-[10px] font-medium uppercase tracking-wide text-foreground/45">
                Média mensal
              </p>
              <p className="text-sm font-semibold tabular-nums text-[var(--orbitly-ink)]">
                {formatBRL(avgMonthly)}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--orbitly-teal)" stopOpacity={0.55} />
                <stop offset="45%" stopColor="var(--orbitly-lime)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--orbitly-lime)" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="color-mix(in oklch, var(--orbitly-ink) 8%, transparent)" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "color-mix(in oklch, var(--orbitly-ink) 45%, transparent)" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "color-mix(in oklch, var(--orbitly-ink) 45%, transparent)" }}
              tickFormatter={formatCompactBRL}
              width={56}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => formatBRL(Number(value))}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="realizada"
              stroke="var(--orbitly-teal)"
              strokeWidth={3.5}
              fill="url(#revenueFill)"
              dot={false}
              activeDot={{ r: 5, fill: "var(--orbitly-teal)", stroke: "#fff", strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="prevista"
              stroke="var(--orbitly-ink)"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />
          </AreaChart>
        </ChartContainer>

        <div className="mt-4 flex items-center gap-5 border-t border-border/40 pt-4">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-[var(--orbitly-teal)]" />
            <span className="text-xs text-foreground/50">Realizada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-4 border-t-2 border-dashed border-[var(--orbitly-ink)]" />
            <span className="text-xs text-foreground/50">Prevista</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
