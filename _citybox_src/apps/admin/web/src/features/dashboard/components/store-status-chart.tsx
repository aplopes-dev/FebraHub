"use client";

import { Cell, Pie, PieChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@citybox/ui/atoms";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@citybox/ui/atoms";
import { useDashboardSummary } from "../hooks/use-dashboard-queries";
import { DASHBOARD_CARD } from "../lib/dashboard-ui";

export function StoreStatusChart() {
  const { data, isLoading } = useDashboardSummary();

  if (isLoading || !data) {
    return (
      <Card className={DASHBOARD_CARD}>
        <div className="h-[250px] w-full animate-pulse bg-muted/40" />
      </Card>
    );
  }

  const chartData = data.storeStatusDistribution;

  return (
    <Card className={DASHBOARD_CARD}>
      <CardHeader className="border-b border-border/40 pb-3">
        <CardTitle className="text-sm font-semibold text-[var(--orbitly-ink)]">
          Status das Lojas
        </CardTitle>
        <p className="text-xs text-foreground/50">Operação e implantação</p>
      </CardHeader>
      <CardContent className="flex items-center gap-4 pt-4">
        <ChartContainer config={{}} className="h-[160px] w-[160px] shrink-0">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={40}
              outerRadius={68}
              paddingAngle={4}
              strokeWidth={0}
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="flex flex-1 flex-col gap-2">
          {chartData.map((item) => (
            <div key={item.name}>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-foreground/60">
                  <span className="h-2 w-2 rounded-full" style={{ background: item.fill }} />
                  {item.name}
                </span>
                <span className="font-semibold text-[var(--orbitly-ink)]">{item.value}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
