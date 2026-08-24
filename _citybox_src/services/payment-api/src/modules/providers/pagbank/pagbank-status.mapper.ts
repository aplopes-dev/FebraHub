const PAGBANK_STATUS_TO_CHARGE: Record<string, string> = {
  WAITING: 'WAITING_PAYMENT',
  IN_ANALYSIS: 'PENDING',
  AUTHORIZED: 'AUTHORIZED',
  PAID: 'PAID',
  DECLINED: 'FAILED',
  CANCELED: 'CANCELLED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
};

export function mapPagBankPaymentStatus(status: string): string {
  return PAGBANK_STATUS_TO_CHARGE[status.toUpperCase()] ?? 'PENDING';
}

export function mapPagBankToPaymentStatus(chargeStatus: string): string {
  if (chargeStatus === 'AUTHORIZED') return 'AUTHORIZED';
  if (chargeStatus === 'PAID') return 'PAID';
  if (chargeStatus === 'REFUNDED') return 'REFUNDED';
  if (chargeStatus === 'CANCELLED') return 'CANCELLED';
  if (chargeStatus === 'FAILED') return 'FAILED';
  return 'PENDING';
}

export function isPagBankPaidStatus(status: string): boolean {
  return ['PAID', 'AUTHORIZED'].includes(status.toUpperCase());
}

export function mapPagBankEventToInternalWebhook(status: string): string {
  const normalized = status.toUpperCase();
  if (normalized === 'PAID') return 'payment.payment.received';
  if (normalized === 'AUTHORIZED') return 'payment.payment.authorized';
  if (normalized === 'CANCELED' || normalized === 'CANCELLED') return 'payment.charge.cancelled';
  if (normalized === 'DECLINED') return 'payment.payment.failed';
  if (normalized === 'REFUNDED') return 'payment.payment.refunded';
  return 'payment.charge.updated';
}
