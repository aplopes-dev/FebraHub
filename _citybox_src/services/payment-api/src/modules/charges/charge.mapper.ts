import type { Charge, ChargeItem, Payment } from '../../generated/prisma/client.js';
import { decimalToNumber } from '../../common/utils/serialization.js';

export function mapProviderStatusToChargeStatus(status: string): string {
  const allowed = new Set([
    'DRAFT',
    'CREATED',
    'PENDING',
    'WAITING_PAYMENT',
    'AUTHORIZED',
    'PAID',
    'CONFIRMED',
    'RECEIVED',
    'OVERDUE',
    'CANCELLED',
    'EXPIRED',
    'REFUNDED',
    'PARTIALLY_REFUNDED',
    'CHARGEBACK',
    'DISPUTED',
    'FAILED',
    'ERROR',
  ]);
  return allowed.has(status) ? status : 'CREATED';
}

export function toChargeResponse(
  charge: Charge & { items?: ChargeItem[] },
  extras?: {
    pix?: Record<string, unknown>;
    boleto?: Record<string, unknown>;
    checkout?: Record<string, unknown>;
    infiniteTap?: Record<string, unknown>;
    stonePos?: Record<string, unknown>;
    paymentMethods?: string[];
    splits?: Array<Record<string, unknown>>;
  },
) {
  return {
    id: charge.id,
    status: charge.status,
    provider: charge.provider,
    providerReference: charge.providerChargeId,
    sourceSystem: charge.sourceSystem,
    externalReference: charge.externalReference,
    merchantId: charge.merchantId,
    amount: decimalToNumber(charge.amount),
    currency: charge.currency,
    dueDate: charge.dueDate?.toISOString().slice(0, 10),
    expiresAt: charge.expiresAt?.toISOString(),
    paymentUrl: charge.paymentUrl,
    paymentMethods: extras?.paymentMethods ?? [],
    pix: extras?.pix,
    boleto: extras?.boleto,
    checkout: extras?.checkout,
    infiniteTap: extras?.infiniteTap,
    stonePos: extras?.stonePos,
    items: charge.items?.map((item) => ({
      id: item.id,
      externalItemId: item.externalItemId,
      description: item.description,
      quantity: decimalToNumber(item.quantity),
      unitValue: decimalToNumber(item.unitValue),
      totalValue: decimalToNumber(item.totalValue),
    })),
    metadata: charge.metadataJson,
    splits: extras?.splits,
    createdAt: charge.createdAt.toISOString(),
    updatedAt: charge.updatedAt.toISOString(),
  };
}

export function toPaymentResponse(payment: Payment) {
  return {
    id: payment.id,
    chargeId: payment.chargeId,
    provider: payment.provider,
    paymentMethod: payment.paymentMethod,
    status: payment.status,
    grossAmount: decimalToNumber(payment.grossAmount),
    feeAmount: decimalToNumber(payment.feeAmount),
    netAmount: decimalToNumber(payment.netAmount),
    paidAt: payment.paidAt?.toISOString(),
    confirmedAt: payment.confirmedAt?.toISOString(),
    availableAt: payment.availableAt?.toISOString(),
    settledAt: payment.settledAt?.toISOString(),
    providerPaymentId: payment.providerPaymentId,
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
  };
}
