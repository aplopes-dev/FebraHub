"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@citybox/ui/atoms";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@citybox/ui/atoms";
import { useDashboardSummary } from "../hooks/use-dashboard-queries";
import { DASHBOARD_CARD } from "../lib/dashboard-ui";

export function ClientStatusChart() {
  const { data, isLoading } = useDashboardSummary();

  if (isLoading || !data) {
    return (
      <Card className={DASHBOARD_CARD}>
        <div className="h-[250px] w-full animate-pulse bg-muted/40" />
      </Card>
    );
  }

  const chartData = data.clientStatusDistribution;

  return (
    <Card className={DASHBOARD_CARD}>
      <CardHeader className="border-b border-border/40 pb-3">
        <CardTitle className="text-sm font-semibold text-[var(--orbitly-ink)]">
          Saúde dos Clientes
        </CardTitle>
        <p className="text-xs text-foreground/50">Distribuição por status</p>
      </CardHeader>
      <CardContent className="pt-4">
        <ChartContainer config={{}} className="h-[180px] w-full">
          <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 8 }}>
            <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="color-mix(in oklch, var(--orbitly-ink) 6%, transparent)" />
            <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={90} tick={{ fontSize: 11 }} />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18}>
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
