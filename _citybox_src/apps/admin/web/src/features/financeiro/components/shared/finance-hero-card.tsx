import type { ReactNode } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@citybox/ui";
import { DASHBOARD_CARD } from "../dashboard/dashboard-ui";

export type FinanceHeroVariant = "lime" | "teal";

export interface FinanceHeroCardProps {
  label: string;
  value: string;
  trend: string;
  icon: ReactNode;
  variant: FinanceHeroVariant;
  trendPositive?: boolean;
}

export function FinanceHeroCard({
  label,
  value,
  trend,
  icon,
  variant,
  trendPositive = true,
}: FinanceHeroCardProps) {
  return (
    <div
      className={cn(
        DASHBOARD_CARD,
        "relative min-h-[148px] p-5",
        variant === "lime"
          ? "bg-[linear-gradient(135deg,color-mix(in_oklch,var(--orbitly-lime)_55%,white)_0%,color-mix(in_oklch,var(--orbitly-lime)_20%,white)_100%)]"
          : "bg-[linear-gradient(135deg,color-mix(in_oklch,var(--orbitly-teal)_45%,white)_0%,color-mix(in_oklch,var(--orbitly-teal)_15%,white)_100%)]",
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, color-mix(in oklch, var(--orbitly-ink) 8%, transparent) 1px, transparent 0)",
          backgroundSize: "20px 20px",
        }}
      />

      <div className="relative flex h-full flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-[color-mix(in_oklch,var(--orbitly-ink)_70%,transparent)]">
            {label}
          </p>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/50">
            {icon}
          </div>
        </div>

        <div>
          <p className="text-3xl font-bold tracking-tight text-[var(--orbitly-ink)]">
            {value}
          </p>
          <div
            className={cn(
              "mt-1.5 flex items-center gap-1 text-xs font-medium",
              trendPositive ? "text-emerald-700" : "text-red-600",
            )}
          >
            {trendPositive ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            <span>{trend}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
