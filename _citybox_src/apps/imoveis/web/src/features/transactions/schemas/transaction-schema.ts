import { z } from 'zod';
import { CREATABLE_TRANSACTION_PAYMENT_METHODS } from '../lib/payment-method-labels';

export const createTransactionSchema = z.object({
  type: z.enum(['SALE', 'RENTAL']),
  propertyId: z.string().min(1, 'Selecione um imóvel'),
  leadId: z.string().min(1, 'Selecione um cliente/lead'),
  dealId: z.string().min(1).optional(),
  grossValueCents: z.number().int().positive('O valor deve ser maior que zero'),
  paymentMethod: z.enum(CREATABLE_TRANSACTION_PAYMENT_METHODS, {
    message: 'Selecione o meio de pagamento',
  }),
  sellerId: z.string().min(1, 'Selecione o corretor vendedor'),
  initialStatus: z.enum(['PROPOSAL', 'CONTRACT_SIGNED']),
});

export type CreateTransactionFormValues = z.infer<typeof createTransactionSchema>;

/** Converte string de moeda (ex: "1.500,00" ou dígitos em centavos) em centavos. */
export function parseCurrencyToCents(value: string): number {
  const digits = value.replace(/\D/g, '');
  if (!digits) return 0;
  return Number.parseInt(digits, 10);
}

/** Formata centavos para exibição em input (estilo calculadora, pt-BR). */
export function formatCentsToCurrencyInput(cents: number): string {
  if (cents <= 0) return '';
  return maskCurrencyInput(String(cents));
}

/**
 * Máscara progressiva BRL: cada dígito entra como centavo (350000 → R$ 3.500,00).
 * Sempre exibe 2 casas decimais para permitir zeros à direita durante a digitação.
 */
export function maskCurrencyInput(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  const cents = Number.parseInt(digits, 10);
  const reais = cents / 100;
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(reais);
}

/** Remove zero à esquerda em percentuais digitados (ex.: "05" → 5). */
export function parsePercentInput(raw: string): number {
  const normalized = raw.replace(',', '.').trim();
  if (!normalized) return 0;
  const withoutLeadingZeros = normalized.replace(/^0+(?=\d)/, '');
  const value = Number(withoutLeadingZeros);
  return Number.isNaN(value) ? 0 : value;
}

export function formatPercentInput(value: number): string {
  if (value === 0) return '';
  return String(value);
}
