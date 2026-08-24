import type { SubscriptionCycle } from "../types";

export const billingCycleConfig: Record<
  SubscriptionCycle,
  { label: string; shortLabel: string }
> = {
  MONTHLY: { label: "Mensal", shortLabel: "mês" },
  YEARLY: { label: "Anual", shortLabel: "ano" },
};

export function formatPlanPrice(
  priceCents: number,
  cycle: SubscriptionCycle,
): string {
  const formatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(priceCents / 100);

  return `${formatted} / ${billingCycleConfig[cycle].shortLabel}`;
}
