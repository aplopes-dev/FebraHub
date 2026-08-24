"use client";

import Link from "next/link";
import {
  BriefcaseBusiness,
  CreditCard,
  Store,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@citybox/ui";
import { useDashboardSummary } from "../hooks/use-dashboard-queries";
import { DASHBOARD_CARD, DASHBOARD_CARD_INNER } from "../lib/dashboard-ui";

const MODULE_ICONS = {
  clientes: BriefcaseBusiness,
  lojas: Store,
  financeiro: Wallet,
  planos: CreditCard,
  usuarios: Users,
} as const;

const MODULE_COLORS = {
  clientes: "bg-[color-mix(in_oklch,var(--orbitly-lime)_30%,white)]",
  lojas: "bg-[color-mix(in_oklch,var(--orbitly-teal)_25%,white)]",
  financeiro: "bg-[color-mix(in_oklch,var(--orbitly-sand)_50%,white)]",
  planos: "bg-[color-mix(in_oklch,var(--orbitly-lime)_20%,white)]",
  usuarios: "bg-[color-mix(in_oklch,var(--orbitly-teal)_15%,white)]",
} as const;

export function PlatformActivityFeed() {
  const { data, isLoading } = useDashboardSummary();

  if (isLoading || !data) {
    return (
      <div className={cn(DASHBOARD_CARD, "flex flex-col p-5 h-[360px] animate-pulse bg-muted/40")} />
    );
  }

  const items = data.recentActivity;

  return (
    <div className={cn(DASHBOARD_CARD, "flex flex-col p-5")}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--orbitly-ink)]">
            Atividade Recente
          </h3>
          <p className="text-xs text-foreground/50">Últimos eventos cross-módulo</p>
        </div>
        <Link
          href="/audit"
          className="text-xs font-medium text-foreground/45 hover:text-[var(--orbitly-ink)]"
        >
          Ver auditoria
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        {items.map((item) => {
          const Icon = MODULE_ICONS[item.module as keyof typeof MODULE_ICONS] ?? Store;
          return (
            <div
              key={item.id}
              className={cn(DASHBOARD_CARD_INNER, "flex items-start gap-3 p-3")}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  MODULE_COLORS[item.module as keyof typeof MODULE_COLORS] ?? MODULE_COLORS.lojas,
                )}
              >
                <Icon className="h-3.5 w-3.5 text-[var(--orbitly-ink)]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-[var(--orbitly-ink)]">
                    {item.title}
                  </p>
                  <span className="shrink-0 text-[10px] text-foreground/40">
                    {item.time}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-foreground/50">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
