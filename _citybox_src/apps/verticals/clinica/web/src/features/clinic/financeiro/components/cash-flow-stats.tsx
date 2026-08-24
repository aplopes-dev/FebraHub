"use client";

import { TrendingUp, TrendingDown, Wallet, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@citybox/ui";

interface CashFlowStatsProps {
  income: {
    received: number;
    toReceive: number;
    total: number;
  };
  expense: {
    paid: number;
    toPay: number;
    total: number;
  };
  balance: {
    current: number;
    projected: number;
  };
  /** Default true — ocultar cards sem permissão de visualizar. */
  showIncome?: boolean;
  showExpense?: boolean;
  showBalance?: boolean;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function IncomeCard({ income }: { income: CashFlowStatsProps["income"] }) {
  const progressPercent =
    income.total > 0 ? Math.min((income.received / income.total) * 100, 100) : 0;
  const receivedLabel = formatCurrency(income.received);
  const toReceiveLabel = formatCurrency(income.toReceive);
  const totalLabel = formatCurrency(income.total);

  return (
    <div className="flex min-w-0 flex-col gap-2.5 rounded-lg border bg-card p-3 sm:p-4">
      <div className="flex min-w-0 items-start gap-2.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-green-500/20 bg-green-500/10 xl:size-10">
          <TrendingUp className="size-4 text-green-600 xl:size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground xl:text-sm">Receita</p>
          <p
            className="truncate text-base font-semibold tabular-nums text-green-700 xl:text-xl"
            title={receivedLabel}
          >
            {receivedLabel}
          </p>
        </div>
      </div>
      <div className="min-w-0 space-y-1.5">
        <div className="flex min-w-0 items-baseline justify-between gap-2 text-xs xl:text-sm">
          <span className="shrink-0 text-muted-foreground">A receber</span>
          <span className="min-w-0 truncate text-right font-medium tabular-nums" title={toReceiveLabel}>
            {toReceiveLabel}
          </span>
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-green-50">
          <div
            className="h-full rounded-full bg-green-500 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="truncate text-[11px] text-muted-foreground xl:text-xs" title={totalLabel}>
          Total previsto: {totalLabel}
        </div>
      </div>
    </div>
  );
}

function ExpenseCard({ expense }: { expense: CashFlowStatsProps["expense"] }) {
  const progressPercent =
    expense.total > 0 ? Math.min((expense.paid / expense.total) * 100, 100) : 0;
  const paidLabel = formatCurrency(expense.paid);
  const toPayLabel = formatCurrency(expense.toPay);
  const totalLabel = formatCurrency(expense.total);

  return (
    <div className="flex min-w-0 flex-col gap-2.5 rounded-lg border bg-card p-3 sm:p-4">
      <div className="flex min-w-0 items-start gap-2.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 xl:size-10">
          <TrendingDown className="size-4 text-red-600 xl:size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground xl:text-sm">Despesa</p>
          <p
            className="truncate text-base font-semibold tabular-nums text-red-700 xl:text-xl"
            title={paidLabel}
          >
            {paidLabel}
          </p>
        </div>
      </div>
      <div className="min-w-0 space-y-1.5">
        <div className="flex min-w-0 items-baseline justify-between gap-2 text-xs xl:text-sm">
          <span className="shrink-0 text-muted-foreground">A pagar</span>
          <span className="min-w-0 truncate text-right font-medium tabular-nums" title={toPayLabel}>
            {toPayLabel}
          </span>
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-red-50">
          <div
            className="h-full rounded-full bg-red-500 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="truncate text-[11px] text-muted-foreground xl:text-xs" title={totalLabel}>
          Total previsto: {totalLabel}
        </div>
      </div>
    </div>
  );
}

function BalanceCard({ balance }: { balance: CashFlowStatsProps["balance"] }) {
  const isCurrentNegative = balance.current < 0;
  const isProjectedNegative = balance.projected < 0;
  const isProjectedBetter = balance.projected > balance.current;
  const isProjectedWorse = balance.projected < balance.current;
  const currentLabel = formatCurrency(balance.current);
  const projectedLabel = formatCurrency(balance.projected);

  const TrendIcon = isProjectedBetter ? ArrowUp : isProjectedWorse ? ArrowDown : Minus;

  return (
    <div className="flex min-w-0 flex-col overflow-hidden rounded-lg border bg-card">
      <div
        className={cn(
          "flex min-w-0 items-start justify-between gap-2 px-3 pt-3 pb-2.5 sm:px-4 sm:pt-4 sm:pb-3",
          isCurrentNegative ? "bg-red-50/60" : "bg-blue-50/40",
        )}
      >
        <div className="flex min-w-0 items-start gap-2.5">
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg border xl:size-10",
              isCurrentNegative
                ? "border-red-500/20 bg-red-500/10"
                : "border-blue-500/20 bg-blue-500/10",
            )}
          >
            <Wallet
              className={cn(
                "size-4 xl:size-5",
                isCurrentNegative ? "text-red-600" : "text-blue-600",
              )}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase xl:text-xs">
              Saldo atual
            </p>
            <p
              className={cn(
                "truncate text-lg font-bold leading-tight tabular-nums xl:text-2xl",
                isCurrentNegative ? "text-red-700" : "text-blue-700",
              )}
              title={currentLabel}
            >
              {currentLabel}
            </p>
          </div>
        </div>

        <span
          className={cn(
            "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium xl:px-2 xl:py-1 xl:text-xs",
            isCurrentNegative
              ? "bg-red-100 text-red-700"
              : "bg-blue-100 text-blue-700",
          )}
        >
          {isCurrentNegative ? "Negativo" : "Positivo"}
        </span>
      </div>

      <div className="mx-3 border-t border-dashed sm:mx-4" />

      <div className="flex min-w-0 items-end justify-between gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="min-w-0">
          <p className="text-[11px] text-muted-foreground xl:text-xs">Saldo previsto</p>
          <p
            className={cn(
              "truncate text-sm font-semibold tabular-nums xl:text-base",
              isProjectedNegative ? "text-red-600" : "text-foreground",
            )}
            title={projectedLabel}
          >
            {projectedLabel}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground xl:text-[11px]">
            ao fim do período
          </p>
        </div>

        <div
          className={cn(
            "flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium xl:px-2.5 xl:py-1.5 xl:text-xs",
            isProjectedBetter
              ? "bg-green-50 text-green-700"
              : isProjectedWorse
                ? "bg-red-50 text-red-600"
                : "bg-muted text-muted-foreground",
          )}
        >
          <TrendIcon className="size-3 xl:size-3.5" />
          <span className="hidden sm:inline">
            {isProjectedBetter ? "Melhora" : isProjectedWorse ? "Piora" : "Estável"}
          </span>
        </div>
      </div>
    </div>
  );
}

export function CashFlowStats({
  income,
  expense,
  balance,
  showIncome = true,
  showExpense = true,
  showBalance = true,
}: CashFlowStatsProps) {
  const visibleCount =
    Number(showIncome) + Number(showExpense) + Number(showBalance);

  return (
    <div
      className={cn(
        "grid min-w-0 grid-cols-1 gap-3 sm:gap-4",
        visibleCount >= 3
          ? "sm:grid-cols-2 2xl:grid-cols-3"
          : visibleCount === 2
            ? "sm:grid-cols-2"
            : "sm:grid-cols-1",
      )}
    >
      {showIncome ? <IncomeCard income={income} /> : null}
      {showExpense ? <ExpenseCard expense={expense} /> : null}
      {showBalance ? (
        <div
          className={cn(
            "min-w-0",
            visibleCount >= 3 && "sm:col-span-2 2xl:col-span-1",
          )}
        >
          <BalanceCard balance={balance} />
        </div>
      ) : null}
    </div>
  );
}
