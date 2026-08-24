"use client";

import { useSearchParams } from "next/navigation";
import { FinanceKpiStrip as SharedFinanceKpiStrip } from "../shared/finance-kpi-strip";
import { useBillingKpis } from "../../hooks/use-finance-queries";
import { formatBRL } from "../../lib/format-finance";

export function FinancialKpiStrip() {
  const searchParams = useSearchParams();
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;

  const { data: kpis, isLoading } = useBillingKpis({
    startDate,
    endDate,
    enabled: !!startDate && !!endDate,
  });

  if (isLoading || !kpis) {
    return <div className="h-20 bg-muted/40 animate-pulse rounded-lg" />;
  }

  const inadimplenciaPercent = Math.round((kpis.inadimplenciaRate || 0) * 100);

  const items = [
    {
      label: "Inadimplência total",
      value: formatBRL(kpis.pastDueAmountCents / 100),
      trend: 0,
      trendInverted: true,
    },
    {
      label: "Taxa de Inadimplência",
      value: `${inadimplenciaPercent}%`,
      trend: 0,
      trendInverted: true,
    },
    {
      label: "MRR Churned (30 dias)",
      value: formatBRL(kpis.mrrChurnedCents / 100),
      trend: 0,
      trendInverted: true,
    },
  ];

  return <SharedFinanceKpiStrip items={items} />;
}
