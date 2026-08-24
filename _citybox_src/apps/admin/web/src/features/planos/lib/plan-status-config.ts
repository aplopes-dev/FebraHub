import type { PlanStatus } from "../types";

export const planStatusConfig: Record<
  PlanStatus,
  { label: string; className: string }
> = {
  ACTIVE: {
    label: "Ativo",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  },
  HIDDEN: {
    label: "Oculto",
    className:
      "border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400",
  },
};
