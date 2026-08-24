"use client";

import { useSearchParams } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@citybox/ui";
import { useBillingKpis } from "../../hooks/use-finance-queries";
import { formatBRLFromCents } from "../../lib/format-finance";
import { DASHBOARD_CARD, DASHBOARD_CARD_PADDING } from "./dashboard-ui";

export function FinancialGoalsRow() {
  const searchParams = useSearchParams();
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;

  const { data: kpis, isLoading } = useBillingKpis({
    startDate,
    endDate,
    enabled: !!startDate && !!endDate,
  });

  if (isLoading || !kpis) {
    return (
      <div className={cn(DASHBOARD_CARD, "h-28 bg-muted/40 animate-pulse rounded-lg")} />
    );
  }

  const expected = kpis.currentMonthExpectedReceiptsCents ?? 0;
  const received = kpis.currentMonthReceivedReceiptsCents ?? 0;
  const totalInvoices = kpis.currentMonthTotalInvoicesCount ?? 0;
  const onTimeInvoices = kpis.currentMonthOnTimeInvoicesCount ?? 0;
  const mrr = kpis.mrrCents ?? 0;
  const pastDue = kpis.pastDueAmountCents ?? 0;

  const goalReceipts = expected > 0 ? Math.round((received / expected) * 100) : 0;
  const goalDelinquency = mrr > 0 ? Math.round((pastDue / mrr) * 100) : 0;
  const goalRenewals = totalInvoices > 0 ? Math.round((onTimeInvoices / totalInvoices) * 100) : 0;

  const goals = [
    {
      label: "Meta de Recebimento",
      current: goalReceipts,
      target: 80,
      detail: `${formatBRLFromCents(received)} de ${formatBRLFromCents(expected)}`,
    },
    {
      label: "Inadimplência vs MRR",
      current: goalDelinquency,
      target: 8,
      detail: `${formatBRLFromCents(pastDue)} sobre MRR`,
      inverted: true,
    },
    {
      label: "Renovações no Prazo",
      current: goalRenewals,
      target: 90,
      detail: `${onTimeInvoices} de ${totalInvoices} assinaturas`,
    },
  ];

  return (
    <div className={cn(DASHBOARD_CARD, DASHBOARD_CARD_PADDING)}>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
        {goals.map((goal) => {
          const inverted = "inverted" in goal && goal.inverted === true;
          const onTrack = inverted
            ? goal.current <= goal.target
            : goal.current >= goal.target * 0.8;

          return (
            <div key={goal.label} className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-[var(--orbitly-ink)]">
                  {goal.label}
                </p>
                <span
                  className={cn(
                    "flex items-center gap-0.5 text-xs font-semibold tabular-nums",
                    onTrack ? "text-emerald-600" : "text-amber-600",
                  )}
                >
                  {goal.current}%
                  <ArrowUpRight className="h-3 w-3" />
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-[color-mix(in_oklch,var(--orbitly-sand)_40%,white)]">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(goal.current, 100)}%`,
                    backgroundImage: onTrack
                      ? "var(--admin-nav-highlight-gradient)"
                      : "linear-gradient(to right, #fbbf24, #f97316)",
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-foreground/45">
                <span>{goal.detail}</span>
                <span>Meta {goal.target}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
