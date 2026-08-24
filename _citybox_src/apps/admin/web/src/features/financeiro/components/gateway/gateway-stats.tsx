"use client";

import { Activity, Wifi } from "lucide-react";
import { FinanceHeroCard } from "../shared/finance-hero-card";
import { FinanceKpiStrip } from "../shared/finance-kpi-strip";
import { FinancePageStats } from "../shared/finance-page-stats";
import { useGatewayStats } from "../../hooks/use-finance-queries";

export function GatewayStats() {
  const { data, isLoading } = useGatewayStats();

  if (isLoading || !data) {
    return <div className="h-[140px] bg-muted/40 animate-pulse rounded-lg" />;
  }

  const { totalEvents, lastMinutes, kpis } = data;

  return (
    <FinancePageStats
      heroes={
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FinanceHeroCard
            label="Conexão Asaas"
            value="Online"
            trend={
              lastMinutes !== null
                ? `Último webhook há ${lastMinutes} min`
                : "Sem eventos recentes"
            }
            variant="lime"
            icon={<Wifi className="h-4 w-4 text-[var(--orbitly-ink)]" />}
          />
          <FinanceHeroCard
            label="Eventos Registrados"
            value={String(totalEvents)}
            trend="Total acumulado"
            variant="teal"
            icon={<Activity className="h-4 w-4 text-[var(--orbitly-ink)]" />}
          />
        </div>
      }
      kpis={<FinanceKpiStrip items={kpis} />}
    />
  );
}
