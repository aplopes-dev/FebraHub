"use client";

import Link from "next/link";
import { Badge } from "@citybox/ui/atoms";
import { cn } from "@citybox/ui";
import type { Subscription, SubscriptionStatus, SubscriptionPlan, BillingCycle } from "../../types";
import {
  subscriptionStatusConfig,
  planConfig,
} from "../../lib/subscription-status-config";

// ─── Célula: Cliente ──────────────────────────────────────────────────────────

export function SubscriptionClientCell({
  subscription,
}: {
  subscription: Subscription;
}) {
  return (
    <Link
      href={`/clientes/${subscription.clientId}`}
      className="text-sm font-medium text-primary hover:underline truncate max-w-[200px] block"
    >
      {subscription.clientName}
    </Link>
  );
}

// ─── Célula: Plano ────────────────────────────────────────────────────────────

export function PlanCell({ plan }: { plan: SubscriptionPlan | string }) {
  const config = planConfig[plan as SubscriptionPlan] || {
    label: plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : "Starter",
    className: "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
  };
  return (
    <Badge variant="outline" className={cn("w-fit text-xs font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}

// ─── Célula: Ciclo ────────────────────────────────────────────────────────────

export function CycleCell({ cycle }: { cycle: BillingCycle }) {
  const labels: Record<BillingCycle, string> = {
    mensal: "Mensal",
    anual: "Anual",
  };
  return <span className="text-sm text-muted-foreground">{labels[cycle]}</span>;
}

// ─── Célula: MRR ──────────────────────────────────────────────────────────────

export function MrrCell({ mrr }: { mrr: number }) {
  const formatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(mrr / 100);

  return <span className="text-sm tabular-nums font-medium">{formatted}</span>;
}

// ─── Célula: Próxima Renovação ────────────────────────────────────────────────

export function RenewalCell({
  subscription,
}: {
  subscription: Subscription;
}) {
  const [year, month, day] = subscription.nextRenewal.split("-");
  const formatted = `${day}/${month}/${year}`;

  const renewalDate = new Date(subscription.nextRenewal);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = renewalDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const isOverdue = subscription.status === "atrasado";

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm tabular-nums">{formatted}</span>
      {isOverdue ? (
        <span className="text-xs text-destructive">atrasado</span>
      ) : diffDays >= 0 && diffDays <= 7 ? (
        <span className="text-xs text-amber-600">em {diffDays}d</span>
      ) : null}
    </div>
  );
}

// ─── Célula: Status ───────────────────────────────────────────────────────────

export function SubscriptionStatusCell({
  status,
}: {
  status: SubscriptionStatus;
}) {
  const { label, className } = subscriptionStatusConfig[status];
  return (
    <Badge variant="outline" className={cn("w-fit text-xs font-medium", className)}>
      {label}
    </Badge>
  );
}
