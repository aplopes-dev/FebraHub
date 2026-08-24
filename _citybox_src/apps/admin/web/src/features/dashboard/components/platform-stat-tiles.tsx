"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@citybox/ui";
import { useDashboardSummary } from "../hooks/use-dashboard-queries";
import { DASHBOARD_CARD } from "../lib/dashboard-ui";
import { formatBRL } from "@/features/financeiro/lib/format-finance";

const ACCENT_STYLES = {
  lime: "border-l-[var(--orbitly-lime)] bg-[color-mix(in_oklch,var(--orbitly-lime)_12%,white)]",
  teal: "border-l-[var(--orbitly-teal)] bg-[color-mix(in_oklch,var(--orbitly-teal)_10%,white)]",
  ink: "border-l-[var(--orbitly-ink)] bg-[color-mix(in_oklch,var(--orbitly-ink)_6%,white)]",
  sand: "border-l-[var(--orbitly-sand)] bg-[color-mix(in_oklch,var(--orbitly-sand)_35%,white)]",
} as const;

export function PlatformStatTiles() {
  const { data, isLoading } = useDashboardSummary();

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={cn(DASHBOARD_CARD, "h-24 animate-pulse bg-muted/40")} />
        ))}
      </div>
    );
  }

  const tiles = [
    {
      id: "mrr",
      label: "MRR",
      value: formatBRL(data.mrrCents / 100),
      hint: "Receita recorrente mensal",
      trend: data.mrrCentsTrend,
      trendPositive: !data.mrrCentsTrend.startsWith("-"),
      accent: "lime" as const,
    },
    {
      id: "clients",
      label: "Clientes Ativos",
      value: String(data.clientsCount),
      hint: `${data.clientsCountTotal} cadastrados`,
      trend: data.clientsCountTrend,
      trendPositive: !data.clientsCountTrend.startsWith("-"),
      accent: "teal" as const,
    },
    {
      id: "stores",
      label: "Lojas",
      value: String(data.storesCount),
      hint: `${data.storesCountTotal} no ecossistema`,
      trend: data.storesCountTrend,
      trendPositive: !data.storesCountTrend.startsWith("-"),
      accent: "ink" as const,
    },
    {
      id: "subscribers",
      label: "Assinantes",
      value: data.subscribersCount.toLocaleString("pt-BR"),
      hint: "Planos ativos",
      trend: data.subscribersCountTrend,
      trendPositive: !data.subscribersCountTrend.startsWith("-"),
      accent: "sand" as const,
    },
    {
      id: "delinquent",
      label: "Inadimplentes",
      value: String(data.delinquentCount),
      hint: "Clientes com pendência",
      trend: data.delinquentCountTrend,
      trendPositive: false,
      accent: "ink" as const,
    },
    {
      id: "team",
      label: "Equipe Admin",
      value: String(data.teamActiveCount),
      hint: `${data.pendingInvitesCount} convites pendentes`,
      accent: "teal" as const,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {tiles.map((tile) => (
        <div
          key={tile.id}
          className={cn(
            DASHBOARD_CARD,
            "border-l-4 p-4",
            ACCENT_STYLES[tile.accent],
          )}
        >
          <p className="text-[11px] font-medium uppercase tracking-wide text-foreground/45">
            {tile.label}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-[var(--orbitly-ink)]">
            {tile.value}
          </p>
          <p className="mt-1 text-xs text-foreground/50">{tile.hint}</p>
          {tile.trend && tile.trend !== "+0%" && tile.trend !== "0" && tile.trend !== "+0" ? (
            <div
              className={cn(
                "mt-2 flex items-center gap-1 text-[11px] font-medium",
                tile.trendPositive ? "text-emerald-600" : "text-red-600",
              )}
            >
              {tile.trendPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {tile.trend}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
