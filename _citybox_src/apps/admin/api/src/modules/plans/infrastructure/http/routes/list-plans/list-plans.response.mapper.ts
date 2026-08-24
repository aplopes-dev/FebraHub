import type { Plan } from '../../../../domain/entities/plan.entity';

export function toPlanListItem(plan: Plan, subscriberCount: number) {
  return {
    id: plan.id,
    code: plan.code,
    name: plan.name,
    description: plan.description,
    prices: plan.prices.map((p) => ({
      id: p.id,
      stripePriceId: p.stripePriceId,
      cycle: p.cycle,
      priceCents: p.priceCents,
      status: p.status ?? 'ACTIVE',
    })),
    vertical: plan.vertical,
    tier: plan.tier,
    maxNegocios: plan.maxNegocios,
    maxUsers: plan.maxUsers,
    maxProducts: plan.maxProducts,
    status: plan.status,
    subscriberCount,
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
  };
}
