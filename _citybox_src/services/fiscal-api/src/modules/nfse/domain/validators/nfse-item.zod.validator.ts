import { z } from 'zod';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import { ZodUtils } from '../../../../shared/core/utils/zod-utils';

const ROUNDING_TOLERANCE = 0.01;

export type NfseItemDto = {
  description: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
  serviceCode: string;
  taxJson?: Record<string, unknown> | null;
};

const itemSchema = z.object({
  description: z.string().min(1, 'descrição do serviço é obrigatória'),
  quantity: z.number().positive('quantidade deve ser maior que zero'),
  unitValue: z.number().min(0, 'valor unitário não pode ser negativo'),
  totalValue: z.number().min(0, 'valor total não pode ser negativo'),
  // "17.02" — formato item.subitem da LC 116/2003 (padrão do contrato
  // nfse-api.md), convertido para o código nacional de 6 dígitos (cTribNac)
  // em dps-xml.builder.ts.
  serviceCode: z
    .string()
    .regex(
      /^\d{2}\.\d{2}$/,
      'código de serviço deve estar no formato NN.NN (LC 116/2003)',
    ),
  taxJson: z.record(z.string(), z.unknown()).nullish(),
});

/// Valida a completude de um item de serviço de NFS-e (US2 Acceptance
/// Scenario, mesma lógica de SC-004 já aplicada a NF-e) — rejeitado ANTES de
/// qualquer reserva de numeração ou tentativa de transmissão ao provider.
export function validateNfseItem(item: NfseItemDto, context: string): void {
  const parsed = itemSchema.safeParse(item);
  if (!parsed.success) {
    const msg = ZodUtils.formatZodError(parsed.error);
    throw new ValidatorDomainError({
      internalMessage: `Invalid NFS-e item: ${msg}`,
      externalMessage: msg,
      context,
    });
  }

  const expectedTotal = item.quantity * item.unitValue;
  if (Math.abs(expectedTotal - item.totalValue) > ROUNDING_TOLERANCE) {
    throw new ValidatorDomainError({
      internalMessage: `Item totalValue (${item.totalValue}) does not match quantity * unitValue (${expectedTotal})`,
      externalMessage: `Valor total do item não confere com quantidade × valor unitário`,
      context,
    });
  }
}

export function validateNfseItems(items: NfseItemDto[], context: string): void {
  if (items.length === 0) {
    throw new ValidatorDomainError({
      internalMessage: 'NFS-e must have at least one service item',
      externalMessage: 'A NFS-e deve ter ao menos um item de serviço',
      context,
    });
  }
  items.forEach((item) => validateNfseItem(item, context));
}
