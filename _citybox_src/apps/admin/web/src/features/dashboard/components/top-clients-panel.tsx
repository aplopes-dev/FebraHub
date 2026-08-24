"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@citybox/ui/atoms";
import { cn } from "@citybox/ui";
import { useDashboardSummary } from "../hooks/use-dashboard-queries";
import { DASHBOARD_CARD, DASHBOARD_CARD_INNER } from "../lib/dashboard-ui";

const STATUS_CLASS: Record<string, string> = {
  ativo: "border-primary/20 bg-primary/5 text-primary",
  inadimplente: "border-amber-500/30 bg-amber-500/10 text-amber-700",
  bloqueado: "border-destructive/30 bg-destructive/10 text-destructive",
};

export function TopClientsPanel() {
  const { data, isLoading } = useDashboardSummary();

  if (isLoading || !data) {
    return (
      <div className={cn(DASHBOARD_CARD, "flex flex-col p-5 h-[360px] animate-pulse bg-muted/40")} />
    );
  }

  const clients = data.topClients;

  return (
    <div className={cn(DASHBOARD_CARD, "flex flex-col p-5")}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--orbitly-ink)]">
            Top Clientes
          </h3>
          <p className="text-xs text-foreground/50">Por volume de lojas</p>
        </div>
        <Link
          href="/clientes"
          className="text-xs font-medium text-foreground/45 hover:text-[var(--orbitly-ink)]"
        >
          Ver todos
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        {clients.map((client, index) => (
          <Link key={client.id} href={`/clientes/${client.id}`} className="block">
            <div
              className={cn(
                DASHBOARD_CARD_INNER,
                "flex items-center gap-3 p-3 transition-colors hover:bg-[color-mix(in_oklch,var(--orbitly-lime)_10%,white)]",
              )}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_oklch,var(--orbitly-ink)_8%,white)] text-xs font-bold text-[var(--orbitly-ink)]">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--orbitly-ink)]">
                  {client.name}
                </p>
                <p className="text-xs text-foreground/50">
                  {client.storesCount} {client.storesCount === 1 ? "loja" : "lojas"} · {client.plan}
                </p>
              </div>
              <Badge
                variant="outline"
                className={cn("shrink-0 text-[10px]", STATUS_CLASS[client.status] ?? "border-muted bg-muted text-muted-foreground")}
              >
                {client.status}
              </Badge>
              <ChevronRight className="h-4 w-4 shrink-0 text-foreground/25" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
