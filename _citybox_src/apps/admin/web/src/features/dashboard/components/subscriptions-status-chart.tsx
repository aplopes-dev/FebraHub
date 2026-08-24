"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@citybox/ui/atoms";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@citybox/ui/atoms";
import { useDashboardSummary } from "../hooks/use-dashboard-queries";
import { DASHBOARD_CARD } from "../lib/dashboard-ui";

export function SubscriptionsStatusChart() {
  const { data, isLoading } = useDashboardSummary();

  if (isLoading || !data) {
    return (
      <Card className={DASHBOARD_CARD}>
        <div className="h-[250px] w-full animate-pulse bg-muted/40" />
      </Card>
    );
  }

  const chartData = data.subscriptionStatusDistribution;

  return (
    <Card className={DASHBOARD_CARD}>
      <CardHeader className="border-b border-border/40 pb-3">
        <CardTitle className="text-sm font-semibold text-[var(--orbitly-ink)]">
          Assinaturas
        </CardTitle>
        <p className="text-xs text-foreground/50">Status de cobrança recorrente</p>
      </CardHeader>
      <CardContent className="pt-4">
        <ChartContainer config={{}} className="h-[180px] w-full">
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="color-mix(in oklch, var(--orbitly-ink) 6%, transparent)" />
            <XAxis dataKey="status" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={36}>
              {chartData.map((entry) => (
                <Cell key={entry.status} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
