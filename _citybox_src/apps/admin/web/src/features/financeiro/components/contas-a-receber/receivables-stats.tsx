"use client";

import { useMemo } from "react";
import { FileText, Wallet } from "lucide-react";
import { FinanceHeroCard } from "../shared/finance-hero-card";
import { FinanceKpiStrip } from "../shared/finance-kpi-strip";
import { FinancePageStats } from "../shared/finance-page-stats";
import { formatBRLFromCents } from "../../lib/format-finance";
import { useFinanceInvoicesStats } from "../../hooks/use-finance-queries";
import type { FilterValues, CheckboxFilterValue, DatePresetFilterValue } from "@citybox/ui/organisms";
import { getDateBounds } from "./receivables-table";
import type { FinanceKpiItem } from "../shared/finance-kpi-strip";

interface ReceivablesStatsProps {
  filters?: FilterValues;
  search?: string;
}

export function ReceivablesStats({ filters, search }: ReceivablesStatsProps) {
  const statusValues = useMemo(() => {
    return ((filters?.["status"] as CheckboxFilterValue) ?? []) as string[];
  }, [filters]);

  const methodValues = useMemo(() => {
    return ((filters?.["method"] as CheckboxFilterValue) ?? []) as string[];
  }, [filters]);

  const dateVal = (filters?.["dueDate"] as DatePresetFilterValue) ?? { preset: null };
  const isDateSpecificWithoutValue = dateVal.preset === "data-especifica" && !dateVal.date;

  const dateBounds = useMemo(() => {
    return getDateBounds(dateVal.preset, dateVal.date);
  }, [dateVal.preset, dateVal.date]);

  const { data: statsRes, isLoading } = useFinanceInvoicesStats({
    status: statusValues.length > 0 ? statusValues : undefined,
    method: methodValues.length > 0 ? methodValues : undefined,
    search: search || undefined,
    startDate: dateBounds?.from,
    endDate: dateBounds?.to,
    enabled: !isDateSpecificWithoutValue,
  });

  const stats = useMemo(() => {
    const s = statsRes || {
      openTotalCents: 0,
      paidTotalCents: 0,
      pendingCount: 0,
      overdueCount: 0,
      paidCount: 0,
      delinquencyRate: 0,
    };

    const kpis: FinanceKpiItem[] = [
      {
        label: "Faturas Pendentes",
        value: String(s.pendingCount),
        trend: 0,
      },
      {
        label: "Faturas Vencidas",
        value: String(s.overdueCount),
        trend: 0,
        trendInverted: true,
      },
      {
        label: "Faturas Pagas",
        value: String(s.paidCount),
        trend: 0,
      },
      {
        label: "Taxa de Inadimplência",
        value: `${s.delinquencyRate}%`,
        trend: 0,
        trendInverted: true,
      },
    ];

    return {
      openTotal: s.openTotalCents,
      paidTotal: s.paidTotalCents,
      kpis,
    };
  }, [statsRes]);

  if (isLoading && !isDateSpecificWithoutValue) {
    return <div className="h-40 bg-muted/40 animate-pulse rounded-lg" />;
  }

  return (
    <FinancePageStats
      heroes={
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FinanceHeroCard
            label="Total em Aberto"
            value={formatBRLFromCents(stats.openTotal)}
            trend="Pendentes + vencidas"
            variant="lime"
            icon={<FileText className="h-4 w-4 text-[var(--orbitly-ink)]" />}
          />
          <FinanceHeroCard
            label="Total Recebido"
            value={formatBRLFromCents(stats.paidTotal)}
            trend="Faturas liquidadas"
            variant="teal"
            icon={<Wallet className="h-4 w-4 text-[var(--orbitly-ink)]" />}
          />
        </div>
      }
      kpis={<FinanceKpiStrip items={stats.kpis} />}
    />
  );
}
