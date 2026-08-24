export const subscriptionStatusConfig: Record<
  "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELED",
  { label: string; className: string }
> = {
  ACTIVE: {
    label: "Ativa",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400",
  },
  TRIALING: {
    label: "Período de Testes",
    className:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-400",
  },
  PAST_DUE: {
    label: "Atrasada",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-400",
  },
  CANCELED: {
    label: "Cancelada",
    className:
      "border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400",
  },
};

export const invoiceStatusConfig: Record<
  "DRAFT" | "OPEN" | "PAID" | "PAST_DUE" | "VOID",
  { label: string; className: string }
> = {
  DRAFT: {
    label: "Rascunho",
    className:
      "border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400",
  },
  OPEN: {
    label: "Em aberto",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-400",
  },
  PAID: {
    label: "Pago",
    className:
      "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/50 dark:text-green-400",
  },
  PAST_DUE: {
    label: "Vencido",
    className:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400",
  },
  VOID: {
    label: "Anulada",
    className:
      "border-muted-foreground/30 bg-muted text-muted-foreground dark:border-muted-foreground/40",
  },
};
