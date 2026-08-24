import type { SubscriptionStatus, SubscriptionPlan, WebhookStatus } from "../types";

export const subscriptionStatusConfig: Record<SubscriptionStatus, { label: string; className: string }> = {
  ativo: {
    label: "Ativo",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  },
  atrasado: {
    label: "Atrasado",
    className: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
  },
  cancelado: {
    label: "Cancelado",
    className: "border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400",
  },
};

export const planConfig: Record<SubscriptionPlan, { label: string; className: string }> = {
  starter: {
    label: "Starter",
    className: "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
  },
  pro: {
    label: "Pro",
    className: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300",
  },
};

export const webhookStatusConfig: Record<WebhookStatus, { label: string; className: string }> = {
  processado: {
    label: "Processado",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  },
  ignorado: {
    label: "Ignorado",
    className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
  },
  erro: {
    label: "Erro",
    className: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
  },
};
