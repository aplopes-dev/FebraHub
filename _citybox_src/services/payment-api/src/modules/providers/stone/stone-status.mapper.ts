export function mapStoneChargeStatus(status?: string): string {
  const normalized = (status ?? '').toLowerCase();
  if (['paid', 'captured', 'settled'].includes(normalized)) return 'CAPTURED';
  if (['authorized', 'approved', 'auth'].includes(normalized)) return 'AUTHORIZED';
  if (['pending', 'created', 'processing', 'waiting'].includes(normalized)) return 'WAITING_PAYMENT';
  if (['canceled', 'cancelled', 'voided'].includes(normalized)) return 'CANCELLED';
  if (['failed', 'declined', 'denied'].includes(normalized)) return 'FAILED';
  if (['refunded'].includes(normalized)) return 'REFUNDED';
  return 'WAITING_PAYMENT';
}

export function mapStoneToPaymentStatus(chargeStatus: string): string {
  if (['CAPTURED', 'PAID', 'RECEIVED', 'CONFIRMED'].includes(chargeStatus)) return 'PAID';
  if (chargeStatus === 'AUTHORIZED') return 'AUTHORIZED';
  if (chargeStatus === 'REFUNDED') return 'REFUNDED';
  if (chargeStatus === 'CANCELLED') return 'CANCELLED';
  if (chargeStatus === 'FAILED') return 'FAILED';
  return 'PENDING';
}

export function mapStoneEventToInternalWebhook(status: string): string {
  if (['CAPTURED', 'PAID', 'RECEIVED'].includes(status)) return 'payment.received';
  if (status === 'AUTHORIZED') return 'payment.authorized';
  if (status === 'CANCELLED') return 'payment.charge.cancelled';
  if (status === 'FAILED') return 'payment.failed';
  return 'payment.charge.updated';
}

export function mapStoneWebhookToChargeStatus(eventType: string, status?: string): string {
  const normalizedEvent = eventType.toLowerCase();
  if (normalizedEvent.includes('capture') || normalizedEvent.includes('paid')) return 'CAPTURED';
  if (normalizedEvent.includes('author')) return 'AUTHORIZED';
  if (normalizedEvent.includes('cancel')) return 'CANCELLED';
  return mapStoneChargeStatus(status);
}
