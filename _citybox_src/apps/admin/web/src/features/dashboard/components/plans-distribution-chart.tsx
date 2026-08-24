"use client";

import { Cell, Pie, PieChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@citybox/ui/atoms";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@citybox/ui/atoms";
import { useDashboardSummary } from "../hooks/use-dashboard-queries";
import { DASHBOARD_CARD } from "../lib/dashboard-ui";

export function PlansDistributionChart() {
  const { data, isLoading } = useDashboardSummary();

  if (isLoading || !data) {
    return (
      <Card className={DASHBOARD_CARD}>
        <div className="h-[320px] w-full animate-pulse bg-muted/40" />
      </Card>
    );
  }

  const chartData = data.plansDistribution;
  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card className={DASHBOARD_CARD}>
      <CardHeader className="border-b border-border/40 pb-3">
        <CardTitle className="text-sm font-semibold text-[var(--orbitly-ink)]">
          Mix de Planos
        </CardTitle>
        <p className="text-xs text-foreground/50">{total} assinantes ativos</p>
      </CardHeader>
      <CardContent className="pt-3">
        <ChartContainer config={{}} className="mx-auto h-[200px] w-full max-w-[220px]">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={52}
              outerRadius={80}
              paddingAngle={3}
              strokeWidth={0}
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="mt-2 space-y-1.5">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-foreground/60">
                <span className="h-2 w-2 rounded-full" style={{ background: item.fill }} />
                {item.name}
              </span>
              <span className="font-medium tabular-nums text-[var(--orbitly-ink)]">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
