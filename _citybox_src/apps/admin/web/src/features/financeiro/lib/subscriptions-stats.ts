import { mockSubscriptions } from "../data/mock-subscriptions";
import type { FinanceKpiItem } from "../components/shared/finance-kpi-strip";

export function getSubscriptionsStats() {
  const active = mockSubscriptions.filter((sub) => sub.status === "ativo");
  const overdue = mockSubscriptions.filter((sub) => sub.status === "atrasado");
  const cancelled = mockSubscriptions.filter((sub) => sub.status === "cancelado");
  const pro = mockSubscriptions.filter((sub) => sub.plan === "pro");
  const totalMrr = active.reduce((total, sub) => total + sub.mrr, 0);

  const kpis: FinanceKpiItem[] = [
    {
      label: "Assinaturas Atrasadas",
      value: String(overdue.length),
      trend: 6,
      trendInverted: true,
    },
    {
      label: "Canceladas",
      value: String(cancelled.length),
      trend: -2,
      trendInverted: true,
    },
    {
      label: "Plano Pro",
      value: String(pro.length),
      trend: 14,
    },
    {
      label: "Taxa de Retenção",
      value: `${Math.round((active.length / mockSubscriptions.length) * 100)}%`,
      trend: 4,
    },
  ];

  return {
    activeCount: active.length,
    totalMrr,
    kpis,
  };
}
