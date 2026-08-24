import type { Subscription } from '../../../../domain/entities/subscription.entity';

export function toSubscriptionListItem(subscription: Subscription) {
  return {
    id: subscription.id,
    clientName: subscription.clientName ?? null,
    planId: subscription.planId ?? null,
    planName: subscription.planName ?? null,
    priceCents: subscription.priceCents ?? null,
    planPriceId: subscription.planPriceId,
    cycle: subscription.cycle,
    status: subscription.status,
    currentPeriodStart: subscription.currentPeriodStart
      .toISOString()
      .split('T')[0],
    currentPeriodEnd: subscription.currentPeriodEnd.toISOString().split('T')[0],
    dayOfMonth: subscription.dayOfMonth,
    canceledAt: subscription.canceledAt?.toISOString().split('T')[0] ?? null,
    createdAt: subscription.createdAt.toISOString().split('T')[0],
  };
}
