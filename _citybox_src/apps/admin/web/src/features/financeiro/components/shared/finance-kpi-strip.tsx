import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@citybox/ui";
import { DASHBOARD_CARD } from "../dashboard/dashboard-ui";

export interface FinanceKpiItem {
  label: string;
  value: string;
  trend: number;
  trendInverted?: boolean;
}

interface FinanceKpiStripProps {
  items: FinanceKpiItem[];
}

export function FinanceKpiStrip({ items }: FinanceKpiStripProps) {
  return (
    <div className={cn(DASHBOARD_CARD, "p-0")}>
      <div
        className={cn(
          "grid divide-x divide-y divide-border/50",
          items.length === 3 && "grid-cols-1 sm:grid-cols-3 sm:divide-y-0",
          items.length === 4 && "grid-cols-2 lg:grid-cols-4 lg:divide-y-0",
        )}
      >
        {items.map((kpi) => {
          const isPositiveTrend = kpi.trend > 0;
          const isGood = kpi.trendInverted ? !isPositiveTrend : isPositiveTrend;

          return (
            <div key={kpi.label} className="flex flex-col gap-2 p-5">
              <p className="text-xs font-medium text-foreground/50">{kpi.label}</p>
              <p className="text-2xl font-bold tracking-tight text-[var(--orbitly-ink)]">
                {kpi.value}
              </p>
              <div
                className={cn(
                  "flex items-center gap-1 text-xs font-medium",
                  isGood ? "text-emerald-600" : "text-red-600",
                )}
              >
                {isPositiveTrend ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                <span>
                  {kpi.trend > 0 ? "+" : ""}
                  {kpi.trend}% vs mês passado
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
