"use client";

import { Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@citybox/ui/atoms";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@citybox/ui/atoms";
import { useDashboardSummary } from "../hooks/use-dashboard-queries";
import { DASHBOARD_CARD } from "../lib/dashboard-ui";

const chartConfig: ChartConfig = {
  lojas: { label: "Lojas", color: "var(--orbitly-teal)" },
  clientes: { label: "Clientes", color: "var(--orbitly-lime)" },
};

export function VerticalsChart() {
  const { data, isLoading } = useDashboardSummary();

  if (isLoading || !data) {
    return (
      <Card className={DASHBOARD_CARD}>
        <div className="h-[280px] w-full animate-pulse bg-muted/40" />
      </Card>
    );
  }

  const chartData = data.verticalsDistribution;

  return (
    <Card className={DASHBOARD_CARD}>
      <CardHeader className="border-b border-border/40 pb-3">
        <CardTitle className="text-sm font-semibold text-[var(--orbitly-ink)]">
          Verticais do Ecossistema
        </CardTitle>
        <p className="text-xs text-foreground/50">Lojas e clientes por vertical</p>
      </CardHeader>
      <CardContent className="pt-4">
        <ChartContainer config={chartConfig} className="h-[220px] w-full">
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="color-mix(in oklch, var(--orbitly-ink) 6%, transparent)" />
            <XAxis dataKey="vertical" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend 
              wrapperStyle={{ fontSize: 11 }} 
              formatter={(value) => <span className="text-[var(--orbitly-ink)] font-medium">{value}</span>}
            />
            <Bar dataKey="lojas" fill="var(--orbitly-teal)" radius={[4, 4, 0, 0]} barSize={20} />
            <Bar dataKey="clientes" fill="var(--orbitly-lime)" radius={[4, 4, 0, 0]} barSize={20} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
