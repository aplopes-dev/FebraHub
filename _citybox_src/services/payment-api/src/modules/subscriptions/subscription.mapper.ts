import type { Subscription } from '../../generated/prisma/client.js';
import { decimalToNumber } from '../../common/utils/serialization.js';

export function mapProviderSubscriptionStatus(status: string): string {
  const allowed = new Set([
    'ACTIVE',
    'PAUSED',
    'CANCELLED',
    'OVERDUE',
    'TRIAL',
    'EXPIRED',
    'PENDING',
  ]);
  return allowed.has(status) ? status : 'PENDING';
}

export function toSubscriptionResponse(subscription: Subscription) {
  return {
    id: subscription.id,
    status: subscription.status,
    provider: subscription.provider,
    providerSubscriptionId: subscription.providerSubscriptionId,
    sourceSystem: subscription.sourceSystem,
    externalReference: subscription.externalReference,
    merchantId: subscription.merchantId,
    customerId: subscription.customerId,
    amount: decimalToNumber(subscription.amount),
    currency: subscription.currency,
    billingCycle: subscription.billingCycle,
    paymentMethod: subscription.paymentMethod,
    nextDueDate: subscription.nextDueDate?.toISOString().slice(0, 10),
    metadata: subscription.metadataJson,
    cancelledAt: subscription.cancelledAt?.toISOString(),
    pausedAt: subscription.pausedAt?.toISOString(),
    createdAt: subscription.createdAt.toISOString(),
    updatedAt: subscription.updatedAt.toISOString(),
  };
}
