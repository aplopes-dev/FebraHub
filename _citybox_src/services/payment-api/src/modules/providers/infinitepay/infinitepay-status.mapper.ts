export function mapInfinitePayPaymentStatus(status?: string): string {
  const normalized = (status ?? '').toLowerCase();
  if (['paid', 'approved', 'success'].includes(normalized)) return 'PAID';
  if (['refunded', 'refund'].includes(normalized)) return 'REFUNDED';
  if (['pending', 'waiting', 'created'].includes(normalized)) return 'WAITING_PAYMENT';
  if (['cancelled', 'canceled'].includes(normalized)) return 'CANCELLED';
  if (['failed', 'declined'].includes(normalized)) return 'FAILED';
  return 'WAITING_PAYMENT';
}

export function mapInfinitePayWebhookToChargeStatus(payload: {
  paid?: boolean;
  capture_method?: string;
}): string {
  if (payload.paid === true) return 'PAID';
  return 'WAITING_PAYMENT';
}

export function mapInfinitePayToPaymentStatus(chargeStatus: string): string {
  if (chargeStatus === 'PAID') return 'PAID';
  if (chargeStatus === 'REFUNDED') return 'REFUNDED';
  if (chargeStatus === 'CANCELLED') return 'CANCELLED';
  if (chargeStatus === 'FAILED') return 'FAILED';
  return 'PENDING';
}

export function mapInfinitePayEventToInternalWebhook(paid: boolean): string {
  return paid ? 'payment.received' : 'payment.charge.updated';
}
