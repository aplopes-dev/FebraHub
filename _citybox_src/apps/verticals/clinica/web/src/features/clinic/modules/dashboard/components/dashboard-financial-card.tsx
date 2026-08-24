"use client";

import { useState } from "react";
import {
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@citybox/ui/atoms";
import { cn } from "@citybox/ui";
import {
  calculateFinancialProgress,
  DASHBOARD_MONTH_OPTIONS,
  DASHBOARD_YEAR_OPTIONS,
  DEFAULT_DASHBOARD_FINANCIAL_MONTH,
  DEFAULT_DASHBOARD_FINANCIAL_YEAR,
} from "../lib/dashboard-financial";
import { formatDashboardCurrencyFromCents } from "../lib/format-dashboard-currency";
import { useDashboardFinancialSummaryQuery } from "../hooks/use-dashboard-financial-summary-query";

type FinancialBarProps = {
  label: string;
  valueCents: number;
  secondaryLabel?: string;
  secondaryValueCents?: number;
  totalLabel: string;
  totalValueCents: number;
  progress: number;
  icon?: LucideIcon;
  tone: "income" | "expense" | "balance";
};

const TONE_CLASSES = {
  income: {
    icon: "text-green-600",
    value: "text-green-700",
    track: "bg-green-500/10",
    fill: "bg-green-500",
  },
  expense: {
    icon: "text-destructive",
    value: "text-destructive",
    track: "bg-destructive/10",
    fill: "bg-destructive",
  },
  balance: {
    icon: "text-blue-600",
    value: "text-blue-700",
    track: "bg-blue-500/10",
    fill: "bg-blue-500",
  },
} as const;

function FinancialBar({
  label,
  valueCents,
  secondaryLabel,
  secondaryValueCents,
  totalLabel,
  totalValueCents,
  progress,
  icon: Icon,
  tone,
}: FinancialBarProps) {
  const classes = TONE_CLASSES[tone];
  return (
    <div className="space-y-1.5 rounded-xl border border-border/50 px-3 py-3">
      <div className="flex items-center gap-1.5">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {Icon ? (
          <Icon className={cn("size-4", classes.icon)} aria-hidden />
        ) : null}
      </div>

      <div className="flex items-baseline justify-between gap-4">
        <p className={cn("font-semibold tabular-nums", classes.value)}>
          {formatDashboardCurrencyFromCents(valueCents)}
        </p>
        {secondaryLabel ? (
          <p className="text-right text-xs text-muted-foreground">
            {`${secondaryLabel}: `}
            <span className="font-medium tabular-nums text-foreground">
              {formatDashboardCurrencyFromCents(secondaryValueCents ?? 0)}
            </span>
          </p>
        ) : null}
      </div>

      <div
        className={cn("h-2 overflow-hidden rounded-full", classes.track)}
        role="progressbar"
        aria-label={`Progresso de ${label}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        aria-valuetext={`${Math.round(progress)}%`}
      >
        <div
          className={cn("h-full rounded-full transition-all", classes.fill)}
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-right text-xs text-muted-foreground">
        {`${totalLabel}: `}
        <span className="font-medium tabular-nums text-foreground">
          {formatDashboardCurrencyFromCents(totalValueCents)}
        </span>
      </p>
    </div>
  );
}

export function DashboardFinancialCard() {
  const [month, setMonth] = useState(DEFAULT_DASHBOARD_FINANCIAL_MONTH);
  const [year, setYear] = useState(DEFAULT_DASHBOARD_FINANCIAL_YEAR);
  const { summary, isLoading, isError, isFetching } =
    useDashboardFinancialSummaryQuery({ year, month });

  return (
    <Card className="py-0">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 px-4 pt-4 pb-3">
        <CardTitle className="text-xl font-semibold">Financeiro</CardTitle>
        <div className="flex items-center gap-2">
          <Select
            value={String(month)}
            onValueChange={(value) => {
              const nextMonth = Number(value);
              if (
                Number.isInteger(nextMonth) &&
                nextMonth >= 1 &&
                nextMonth <= 12
              ) {
                setMonth(nextMonth);
              }
            }}
          >
            <SelectTrigger className="w-32" aria-label="Mês financeiro">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DASHBOARD_MONTH_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(year)}
            onValueChange={(value) => {
              const nextYear = Number(value);
              if (Number.isInteger(nextYear)) setYear(nextYear);
            }}
          >
            <SelectTrigger className="w-24" aria-label="Ano financeiro">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DASHBOARD_YEAR_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 px-4 pb-4">
        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Carregando resumo financeiro…
          </p>
        ) : isError ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Não foi possível carregar o resumo financeiro.
          </p>
        ) : (
          <>
            {isFetching ? (
              <p className="sr-only" aria-live="polite">
                Atualizando resumo financeiro…
              </p>
            ) : null}
            <FinancialBar
              label="Receitas"
              valueCents={summary.income.totalCents}
              secondaryLabel="A receber"
              secondaryValueCents={summary.income.toReceiveCents}
              totalLabel="Total previsto"
              totalValueCents={summary.income.totalCents}
              progress={calculateFinancialProgress(
                summary.income.receivedCents,
                summary.income.totalCents,
              )}
              icon={TrendingUp}
              tone="income"
            />
            <FinancialBar
              label="Despesas"
              valueCents={summary.expense.totalCents}
              secondaryLabel="A pagar"
              secondaryValueCents={summary.expense.toPayCents}
              totalLabel="Total previsto"
              totalValueCents={summary.expense.totalCents}
              progress={calculateFinancialProgress(
                summary.expense.paidCents,
                summary.expense.totalCents,
              )}
              icon={TrendingDown}
              tone="expense"
            />
            <FinancialBar
              label="Saldo"
              valueCents={summary.balance.currentCents}
              totalLabel="Total previsto"
              totalValueCents={summary.balance.projectedCents}
              progress={calculateFinancialProgress(
                Math.max(summary.balance.currentCents, 0),
                Math.max(summary.balance.projectedCents, 0),
              )}
              tone="balance"
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
