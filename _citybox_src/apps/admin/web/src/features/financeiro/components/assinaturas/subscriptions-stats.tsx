"use client";

import { useMemo } from "react";
import { RefreshCw, Users } from "lucide-react";
import { FinanceHeroCard } from "../shared/finance-hero-card";
import { FinanceKpiStrip } from "../shared/finance-kpi-strip";
import { FinancePageStats } from "../shared/finance-page-stats";
import { formatBRLFromCents } from "../../lib/format-finance";
import { useFinanceSubscriptions } from "../../hooks/use-finance-queries";
import type { FinanceKpiItem } from "../shared/finance-kpi-strip";

export function SubscriptionsStats() {
  const { data: subsRes, isLoading } = useFinanceSubscriptions({ perPage: 100 });

  const stats = useMemo(() => {
    const list = subsRes?.data || [];
    const active = list.filter((sub) => sub.status === "ativo");
    const overdue = list.filter((sub) => sub.status === "atrasado");
    const cancelled = list.filter((sub) => sub.status === "cancelado");
    const pro = list.filter((sub) => sub.plan === "pro");
    const totalMrr = active.reduce((total, sub) => total + sub.mrr, 0);

    const kpis: FinanceKpiItem[] = [
      {
        label: "Assinaturas Atrasadas",
        value: String(overdue.length),
        trend: 0,
        trendInverted: true,
      },
      {
        label: "Canceladas",
        value: String(cancelled.length),
        trend: 0,
        trendInverted: true,
      },
      {
        label: "Plano Pro",
        value: String(pro.length),
        trend: 0,
      },
      {
        label: "Taxa de Retenção",
        value: list.length > 0 ? `${Math.round((active.length / list.length) * 100)}%` : "0%",
        trend: 0,
      },
    ];

    return {
      activeCount: active.length,
      totalMrr,
      kpis,
    };
  }, [subsRes]);

  if (isLoading) {
    return <div className="h-40 bg-muted/40 animate-pulse rounded-lg" />;
  }

  return (
    <FinancePageStats
      heroes={
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FinanceHeroCard
            label="MRR das Assinaturas Ativas"
            value={formatBRLFromCents(stats.totalMrr)}
            trend="Faturamento recorrente mensal"
            variant="lime"
            icon={<RefreshCw className="h-4 w-4 text-[var(--orbitly-ink)]" />}
          />
          <FinanceHeroCard
            label="Assinaturas Ativas"
            value={String(stats.activeCount)}
            trend="Total ativo na plataforma"
            variant="teal"
            icon={<Users className="h-4 w-4 text-[var(--orbitly-ink)]" />}
          />
        </div>
      }
      kpis={<FinanceKpiStrip items={stats.kpis} />}
    />
  );
}
