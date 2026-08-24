import type { ProviderType } from '../../generated/prisma/enums.js';
import {
  mapAsaasEventToChargeStatus,
  mapAsaasEventToInternalWebhook,
  mapAsaasToPaymentStatus,
} from './asaas/asaas-status.mapper.js';
import {
  mapInfinitePayEventToInternalWebhook,
  mapInfinitePayToPaymentStatus,
  mapInfinitePayWebhookToChargeStatus,
} from './infinitepay/infinitepay-status.mapper.js';
import {
  mapPagBankEventToInternalWebhook,
  mapPagBankPaymentStatus,
  mapPagBankToPaymentStatus,
} from './pagbank/pagbank-status.mapper.js';
import {
  mapStoneEventToInternalWebhook,
  mapStoneToPaymentStatus,
  mapStoneWebhookToChargeStatus,
} from './stone/stone-status.mapper.js';

export function mapProviderEventToChargeStatus(
  provider: ProviderType,
  eventType: string,
  paymentStatus?: string,
): string {
  if (provider === 'PAGBANK') {
    return mapPagBankPaymentStatus(paymentStatus ?? eventType);
  }
  if (provider === 'ASAAS') {
    return mapAsaasEventToChargeStatus(eventType, paymentStatus);
  }
  if (provider === 'INFINITE_PAY') {
    return mapInfinitePayWebhookToChargeStatus({ paid: paymentStatus === 'PAID' });
  }
  if (provider === 'STONE') {
    return mapStoneWebhookToChargeStatus(eventType, paymentStatus);
  }
  return paymentStatus ?? 'PENDING';
}

export function mapProviderToPaymentStatus(provider: ProviderType, chargeStatus: string): string {
  if (provider === 'PAGBANK') return mapPagBankToPaymentStatus(chargeStatus);
  if (provider === 'ASAAS') return mapAsaasToPaymentStatus(chargeStatus);
  if (provider === 'INFINITE_PAY') return mapInfinitePayToPaymentStatus(chargeStatus);
  if (provider === 'STONE') return mapStoneToPaymentStatus(chargeStatus);
  return chargeStatus;
}

export function mapProviderEventToInternalWebhook(
  provider: ProviderType,
  eventType: string,
  paymentStatus?: string,
): string {
  if (provider === 'PAGBANK') {
    return mapPagBankEventToInternalWebhook(paymentStatus ?? eventType);
  }
  if (provider === 'ASAAS') {
    return mapAsaasEventToInternalWebhook(eventType);
  }
  if (provider === 'INFINITE_PAY') {
    return mapInfinitePayEventToInternalWebhook(
      paymentStatus === 'PAID' || eventType === 'PAYMENT_RECEIVED',
    );
  }
  if (provider === 'STONE') {
    return mapStoneEventToInternalWebhook(paymentStatus ?? eventType);
  }
  return 'payment.charge.updated';
}

export function isProviderPaidChargeStatus(provider: ProviderType, chargeStatus: string): boolean {
  if (provider === 'PAGBANK') {
    return ['PAID', 'AUTHORIZED', 'RECEIVED', 'CONFIRMED'].includes(chargeStatus);
  }
  if (provider === 'INFINITE_PAY') {
    return ['PAID', 'RECEIVED', 'CONFIRMED'].includes(chargeStatus);
  }
  if (provider === 'STONE') {
    return ['CAPTURED', 'PAID', 'RECEIVED', 'CONFIRMED'].includes(chargeStatus);
  }
  return ['RECEIVED', 'CONFIRMED', 'PAID', 'AUTHORIZED'].includes(chargeStatus);
}
