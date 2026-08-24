/**
 * Contrato core-api → payment-api para checkout multiloja (C-05, Etapa 8).
 *
 * O core-api deve enviar `splitRules` em POST /api/charges por subpedido/loja,
 * com `externalReference` no formato `orderId:storeId` e comissão da plataforma.
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
