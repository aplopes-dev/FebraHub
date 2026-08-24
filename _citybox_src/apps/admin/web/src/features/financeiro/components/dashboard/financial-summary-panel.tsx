"use client";

import { useSearchParams } from "next/navigation";
import { type ReactNode } from "react";
import Link from "next/link";
import { ChevronRight, TrendingUp, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@citybox/ui/atoms";
import { cn } from "@citybox/ui";
import { useBillingKpis } from "../../hooks/use-finance-queries";
import { DASHBOARD_CARD, DASHBOARD_CARD_INNER } from "./dashboard-ui";

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(value);
}

function formatBRLCents(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

interface SummaryRowProps {
  icon: ReactNode;
  iconBg: string;
  label: string;
  value: string;
  href?: string;
}

function SummaryRow({ icon, iconBg, label, value, href }: SummaryRowProps) {
  const content = (
    <div
      className={cn(
        DASHBOARD_CARD_INNER,
        "flex items-center gap-3 p-3 transition-colors",
        href && "hover:bg-[color-mix(in_oklch,var(--orbitly-lime)_12%,white)]",
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          iconBg,
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-foreground/50">{label}</p>
        <p className="text-base font-semibold tabular-nums text-[var(--orbitly-ink)]">
          {value}
        </p>
      </div>
      {href ? (
        <ChevronRight className="h-4 w-4 shrink-0 text-foreground/30" />
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

export function FinancialSummaryPanel() {
  const searchParams = useSearchParams();
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;

  const { data: kpis, isLoading } = useBillingKpis({
    startDate,
    endDate,
    enabled: !!startDate && !!endDate,
  });

  const mrr = kpis ? kpis.mrrCents / 100 : 0;
  const annualProjection = mrr * 12;
  const weeklyAvg = Math.round(mrr / 4);

  const topDefaulters = kpis?.topDefaulters ?? [];

  if (isLoading) {
    return <div className="h-[360px] bg-muted/40 animate-pulse rounded-lg" />;
  }

  return (
    <Card className={cn(DASHBOARD_CARD, "flex flex-col")}>
      <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-border/40">
        <CardTitle className="text-base font-semibold text-[var(--orbitly-ink)]">
          Resumo de Receita
        </CardTitle>
        <Link
          href="/financeiro/faturas-e-cobrancas"
          className="text-xs font-medium text-foreground/50 transition-colors hover:text-[var(--orbitly-ink)]"
        >
          Ver detalhes
        </Link>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-2">
          <SummaryRow
            label="Projeção anual (MRR × 12)"
            value={formatBRL(annualProjection)}
            icon={<TrendingUp className="h-4 w-4 text-[var(--orbitly-ink)]" />}
            iconBg="bg-[color-mix(in_oklch,var(--orbitly-teal)_25%,white)]"
            href="/financeiro/assinaturas"
          />
          <SummaryRow
            label="Receita semanal média"
            value={formatBRL(weeklyAvg)}
            icon={<Wallet className="h-4 w-4 text-[var(--orbitly-ink)]" />}
            iconBg="bg-[color-mix(in_oklch,var(--orbitly-lime)_35%,white)]"
          />
        </div>

        <div className="border-t border-border/40 pt-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-[var(--orbitly-ink)]">
              Top Inadimplentes
            </p>
            <span className="text-xs text-foreground/45">3 maiores valores</span>
          </div>

          <div className="flex flex-col gap-2">
            {topDefaulters.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">
                Nenhum cliente inadimplente no momento.
              </p>
            ) : (
              topDefaulters.map((entry) => (
                <div
                  key={entry.clientId}
                  className={cn(
                    DASHBOARD_CARD_INNER,
                    "flex items-center gap-3 p-3",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--orbitly-ink)]">
                      {entry.clientName}
                    </p>
                    <p className="text-xs text-red-600 tabular-nums">
                      {formatBRLCents(entry.amount)} · {entry.daysOverdue}d atraso
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
