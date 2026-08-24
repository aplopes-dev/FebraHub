const ASAAS_EVENT_TO_CHARGE: Record<string, string> = {
  PAYMENT_CREATED: 'CREATED',
  PAYMENT_UPDATED: 'PENDING',
  PAYMENT_CONFIRMED: 'CONFIRMED',
  PAYMENT_RECEIVED: 'RECEIVED',
  PAYMENT_OVERDUE: 'OVERDUE',
  PAYMENT_DELETED: 'CANCELLED',
  PAYMENT_REFUNDED: 'REFUNDED',
  PAYMENT_RESTORED: 'PENDING',
};

const ASAAS_STATUS_TO_CHARGE: Record<string, string> = {
  PENDING: 'WAITING_PAYMENT',
  RECEIVED: 'RECEIVED',
  CONFIRMED: 'CONFIRMED',
  OVERDUE: 'OVERDUE',
  REFUNDED: 'REFUNDED',
  RECEIVED_IN_CASH: 'RECEIVED',
  REFUND_REQUESTED: 'REFUNDED',
  REFUND_IN_PROGRESS: 'REFUNDED',
  CHARGEBACK_REQUESTED: 'CHARGEBACK',
  CHARGEBACK_DISPUTE: 'DISPUTED',
  AWAITING_CHARGEBACK_REVERSAL: 'DISPUTED',
  DUNNING_REQUESTED: 'OVERDUE',
  DUNNING_RECEIVED: 'RECEIVED',
  AWAITING_RISK_ANALYSIS: 'PENDING',
};

export function mapAsaasEventToChargeStatus(eventType: string, paymentStatus?: string): string {
  if (paymentStatus && ASAAS_STATUS_TO_CHARGE[paymentStatus]) {
    return ASAAS_STATUS_TO_CHARGE[paymentStatus]!;
  }
  return ASAAS_EVENT_TO_CHARGE[eventType] ?? 'PENDING';
}

export function mapAsaasPaymentStatus(status: string): string {
  return ASAAS_STATUS_TO_CHARGE[status] ?? 'PENDING';
}

export function isAsaasPaidStatus(status: string): boolean {
  return ['RECEIVED', 'CONFIRMED', 'PAID'].includes(status);
}

export function mapAsaasToPaymentStatus(chargeStatus: string): string {
  if (chargeStatus === 'CONFIRMED') return 'CONFIRMED';
  if (chargeStatus === 'RECEIVED') return 'PAID';
  if (chargeStatus === 'REFUNDED') return 'REFUNDED';
  if (chargeStatus === 'CANCELLED') return 'CANCELLED';
  if (chargeStatus === 'OVERDUE') return 'FAILED';
  return 'PENDING';
}

export function mapAsaasEventToInternalWebhook(eventType: string): string {
  if (eventType === 'PAYMENT_RECEIVED' || eventType === 'PAYMENT_CONFIRMED') {
    return 'payment.payment.received';
  }
  if (eventType === 'PAYMENT_OVERDUE') return 'payment.charge.overdue';
  if (eventType === 'PAYMENT_DELETED') return 'payment.charge.cancelled';
  if (eventType === 'PAYMENT_REFUNDED') return 'payment.payment.refunded';
  if (eventType === 'PAYMENT_CREATED') return 'payment.charge.created';
  return 'payment.charge.updated';
}
