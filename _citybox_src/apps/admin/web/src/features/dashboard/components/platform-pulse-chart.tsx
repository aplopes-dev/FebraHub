"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@citybox/ui/atoms";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@citybox/ui/atoms";
import { useDashboardSummary } from "../hooks/use-dashboard-queries";
import { DASHBOARD_CARD, DASHBOARD_CARD_INNER } from "../lib/dashboard-ui";

const chartConfig: ChartConfig = {
  mrr: { label: "MRR (R$)", color: "var(--orbitly-teal)" },
  clientes: { label: "Novos clientes", color: "var(--orbitly-lime)" },
  lojas: { label: "Novas lojas", color: "var(--orbitly-ink)" },
};

function formatCompact(value: number) {
  if (value >= 1000) {
    return new Intl.NumberFormat("pt-BR", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }
  return String(value);
}

export function PlatformPulseChart() {
  const { data, isLoading } = useDashboardSummary();

  if (isLoading || !data) {
    return (
      <Card className={DASHBOARD_CARD}>
        <div className="h-[400px] w-full animate-pulse bg-muted/40" />
      </Card>
    );
  }

  const pulseData = data.pulseData;
  const totalMrr = pulseData.reduce((sum, d) => sum + d.mrr, 0);
  const totalClients = pulseData.reduce((sum, d) => sum + d.clientes, 0);
  const totalStores = pulseData.reduce((sum, d) => sum + d.lojas, 0);

  return (
    <Card className={DASHBOARD_CARD}>
      <CardHeader className="border-b border-border/40 pb-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-[var(--orbitly-ink)]">
              Pulso da Plataforma
            </CardTitle>
            <p className="text-sm text-foreground/50">
              Crescimento e receita — últimos 6 meses
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className={DASHBOARD_CARD_INNER + " px-3 py-1.5"}>
              <p className="text-[10px] uppercase tracking-wide text-foreground/40">MRR acum.</p>
              <p className="text-sm font-semibold text-[var(--orbitly-ink)]">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact" }).format(totalMrr)}
              </p>
            </div>
            <div className={DASHBOARD_CARD_INNER + " px-3 py-1.5"}>
              <p className="text-[10px] uppercase tracking-wide text-foreground/40">+Clientes</p>
              <p className="text-sm font-semibold text-[var(--orbitly-ink)]">{totalClients}</p>
            </div>
            <div className={DASHBOARD_CARD_INNER + " px-3 py-1.5"}>
              <p className="text-[10px] uppercase tracking-wide text-foreground/40">+Lojas</p>
              <p className="text-sm font-semibold text-[var(--orbitly-ink)]">{totalStores}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart data={pulseData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="pulseMrr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--orbitly-teal)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="var(--orbitly-teal)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="color-mix(in oklch, var(--orbitly-ink) 6%, transparent)" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
            <YAxis yAxisId="mrr" tickLine={false} axisLine={false} tickFormatter={formatCompact} width={48} tick={{ fontSize: 10 }} />
            <YAxis yAxisId="count" orientation="right" tickLine={false} axisLine={false} allowDecimals={false} width={28} tick={{ fontSize: 10 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area yAxisId="mrr" type="monotone" dataKey="mrr" stroke="var(--orbitly-teal)" fill="url(#pulseMrr)" strokeWidth={2} dot={false} />
            <Line yAxisId="count" type="monotone" dataKey="clientes" stroke="var(--orbitly-lime)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--orbitly-lime)" }} />
            <Line yAxisId="count" type="monotone" dataKey="lojas" stroke="color-mix(in oklch, var(--orbitly-ink) 50%, transparent)" strokeWidth={2} strokeDasharray="4 3" dot={false} />
          </AreaChart>
        </ChartContainer>
        <div className="mt-3 flex flex-wrap gap-4 border-t border-border/40 pt-3">
          <span className="flex items-center gap-1.5 text-xs text-foreground/50">
            <span className="h-2 w-2 rounded-full bg-[var(--orbitly-teal)]" /> MRR
          </span>
          <span className="flex items-center gap-1.5 text-xs text-foreground/50">
            <span className="h-2 w-2 rounded-full bg-[var(--orbitly-lime)]" /> Clientes
          </span>
          <span className="flex items-center gap-1.5 text-xs text-foreground/50">
            <span className="h-0.5 w-3 border-t-2 border-dashed border-foreground/35" /> Lojas
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
