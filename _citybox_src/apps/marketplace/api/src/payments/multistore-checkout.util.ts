/**
 * Alinhado a payment-api/src/contracts/multistore-checkout.contract.ts (C-05).
 */
export const MULTISTORE_CHECKOUT_METADATA = {
  verticalIntegration: 'multistore-checkout',
} as const;

export type MultistoreSplitInput = {
  storeMerchantId: string;
  storeSharePercent: number;
  platformRecipientId?: string;
};

export function buildMultistoreSplitRules(input: MultistoreSplitInput) {
  if (input.storeSharePercent <= 0 || input.storeSharePercent >= 100) {
    throw new RangeError('storeSharePercent deve estar entre 0 e 100 (exclusivo)');
  }

  const platformRecipientId =
    input.platformRecipientId ??
    process.env.PAYMENTS_PLATFORM_RECIPIENT_ID?.trim() ??
    'platform';

  const platformShare = Math.round((100 - input.storeSharePercent) * 100) / 100;

  return [
    {
      recipientId: input.storeMerchantId,
      type: 'PERCENTAGE' as const,
      value: input.storeSharePercent,
    },
    {
      recipientId: platformRecipientId,
      type: 'PERCENTAGE' as const,
      value: platformShare,
    },
  ];
}

export function buildMultistoreChargeMetadata(orderId: string, storeId: string) {
  return {
    ...MULTISTORE_CHECKOUT_METADATA,
    orderId,
    storeId,
  };
}

export function buildMultistoreExternalReference(orderId: string, storeId: string) {
  return `${orderId}:${storeId}`;
}

/** Distribui total do pedido entre subpedidos (último absorve centavos restantes). */
export function allocateSubOrderAmounts(total: number, subOrderCount: number): number[] {
  if (subOrderCount <= 0) return [];
  if (subOrderCount === 1) return [roundMoney(total)];

  const base = roundMoney(total / subOrderCount);
  const amounts = Array.from({ length: subOrderCount }, () => base);
  const allocated = roundMoney(base * subOrderCount);
  const remainder = roundMoney(total - allocated);
  if (remainder !== 0) {
    amounts[amounts.length - 1] = roundMoney(amounts[amounts.length - 1] + remainder);
  }
  return amounts;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
