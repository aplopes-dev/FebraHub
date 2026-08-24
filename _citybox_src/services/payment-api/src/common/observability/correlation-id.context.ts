import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

export type PaymentRequestContext = {
  correlationId: string;
};

export const paymentRequestContext = new AsyncLocalStorage<PaymentRequestContext>();

export function getCorrelationId(): string | undefined {
  return paymentRequestContext.getStore()?.correlationId;
}

export function resolveCorrelationId(headerValue: string | undefined): string {
  const trimmed = headerValue?.trim();
  if (trimmed && trimmed.length <= 128) return trimmed;
  return randomUUID();
}
