"use client";

import { Coins } from "lucide-react";
import { Separator, Skeleton } from "@citybox/ui/atoms";
import { cn } from "@citybox/ui";
import { useStockStats } from "../hooks/use-stock-stats";

const STATUS_COLORS = {
  inStock: "bg-teal-500",
  lowStock: "bg-yellow-500",
  outOfStock: "bg-rose-500",
} as const;

const STATUS_LABELS = {
  inStock: "Em estoque",
  lowStock: "Estoque baixo",
  outOfStock: "Sem estoque",
} as const;

interface StatusLegendItemProps {
  color: string;
  label: string;
  count: number;
}

function StatusLegendItem({ color, label, count }: StatusLegendItemProps) {
  return (
    <div className="flex shrink-0 items-center gap-1.5 text-sm">
      <span className={cn("size-2.5 shrink-0 rounded-full", color)} />
      <span className="whitespace-nowrap text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{count}</span>
    </div>
  );
}

interface MultiColorProgressProps {
  inStock: number;
  lowStock: number;
  outOfStock: number;
  total: number;
}

function MultiColorProgress({
  inStock,
  lowStock,
  outOfStock,
  total,
}: MultiColorProgressProps) {
  const inStockPercent = total > 0 ? (inStock / total) * 100 : 0;
  const lowStockPercent = total > 0 ? (lowStock / total) * 100 : 0;
  const outOfStockPercent = total > 0 ? (outOfStock / total) * 100 : 0;

  return (
    <div className="relative h-2 w-full max-w-full overflow-hidden rounded-full bg-muted lg:max-w-96">
      <div className="flex h-full w-full gap-0.5">
        {inStockPercent > 0 && (
          <div
            className={cn("h-full rounded-full transition-all", STATUS_COLORS.inStock)}
            style={{ width: `${inStockPercent}%` }}
          />
        )}
        {lowStockPercent > 0 && (
          <div
            className={cn("h-full rounded-full transition-all", STATUS_COLORS.lowStock)}
            style={{ width: `${lowStockPercent}%` }}
          />
        )}
        {outOfStockPercent > 0 && (
          <div
            className={cn("h-full rounded-full transition-all", STATUS_COLORS.outOfStock)}
            style={{ width: `${outOfStockPercent}%` }}
          />
        )}
      </div>
    </div>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function HeaderStock() {
  const { data: stats, isLoading } = useStockStats();

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 rounded-lg bg-card p-4 sm:flex-row sm:items-center sm:gap-6 lg:w-2/3">
      <div className="flex shrink-0 items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <Coins className="size-5 text-primary" />
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="text-sm text-muted-foreground">Total do valor Ativo</span>
          {isLoading ? (
            <Skeleton className="mt-0.5 h-7 w-28" />
          ) : (
            <span className="text-xl font-semibold tabular-nums">
              {formatCurrency(stats?.totalValue ?? 0)}
            </span>
          )}
        </div>
      </div>

      <Separator orientation="horizontal" className="sm:hidden" />
      <Separator orientation="vertical" className="hidden h-14 sm:block" />

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {isLoading ? (
          <Skeleton className="h-4 w-24" />
        ) : (
          <span className="text-sm font-medium">
            {stats?.totalProducts ?? 0} Produtos
          </span>
        )}

        {isLoading ? (
          <Skeleton className="h-2 w-full max-w-96" />
        ) : (
          <MultiColorProgress
            inStock={stats?.inStock ?? 0}
            lowStock={stats?.lowStock ?? 0}
            outOfStock={stats?.outOfStock ?? 0}
            total={stats?.totalProducts ?? 0}
          />
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <StatusLegendItem
            color={STATUS_COLORS.inStock}
            label={STATUS_LABELS.inStock}
            count={isLoading ? 0 : (stats?.inStock ?? 0)}
          />
          <StatusLegendItem
            color={STATUS_COLORS.lowStock}
            label={STATUS_LABELS.lowStock}
            count={isLoading ? 0 : (stats?.lowStock ?? 0)}
          />
          <StatusLegendItem
            color={STATUS_COLORS.outOfStock}
            label={STATUS_LABELS.outOfStock}
            count={isLoading ? 0 : (stats?.outOfStock ?? 0)}
          />
        </div>
      </div>
    </div>
  );
}
