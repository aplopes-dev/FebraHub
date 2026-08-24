const ASAAS_SUBSCRIPTION_STATUS: Record<string, string> = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'PAUSED',
  EXPIRED: 'EXPIRED',
};

export function mapAsaasSubscriptionStatus(status: string): string {
  return ASAAS_SUBSCRIPTION_STATUS[status.toUpperCase()] ?? status.toUpperCase();
}

export function mapAsaasSubscriptionEventToInternal(eventType: string): string {
  if (eventType === 'SUBSCRIPTION_CREATED') return 'payment.subscription.created';
  if (eventType === 'SUBSCRIPTION_UPDATED') return 'payment.subscription.updated';
  if (eventType === 'SUBSCRIPTION_DELETED') return 'payment.subscription.cancelled';
  if (eventType === 'SUBSCRIPTION_INACTIVATED') return 'payment.subscription.paused';
  return 'payment.subscription.updated';
}

export function isAsaasSubscriptionEvent(eventType: string): boolean {
  return eventType.startsWith('SUBSCRIPTION_');
}
