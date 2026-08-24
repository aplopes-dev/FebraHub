import { randomUUID } from 'crypto';
import type { Optional } from '../../../../../shared/core/types/optional.type';

/**
 * Sentinela usada só por `bank-reconciliation` (`reconcile-transaction.use-case.ts`)
 * ao gerar um pagamento automático conciliando uma transação de extrato com
 * este lançamento — nunca escolhido pelo operador num formulário manual, e
 * por isso não precisa (nem pode) existir como `PaymentMethod.id` real.
 */
export const RECONCILIATION_PAYMENT_METHOD = 'conciliacao_bancaria';

/**
 * `paymentMethod` é `PaymentMethod.id` (UUID, validado por
 * `assertPaymentMethodExists` no use-case) — spec `007-financeiro-ajustes-ui`
 * US3. Até 2026-08-07 era um enum de aplicação fixo (`research.md` D11 da
 * feature de Lançamentos financeiros); ver `research.md` R1 da 007 para por
 * que o campo continua `String` solto no schema (sem FK) mesmo assim.
 */
export type FinancialEntryPaymentMethod = string;

/**
 * Uma linha de rateio de pagamento — parte do valor de um lançamento
 * efetivamente recebida/paga numa forma específica. Value object embutido no
 * lançamento: não tem vida própria fora dele, e é substituído por completo a
 * cada `save()` (mesmo raciocínio de `CardRateTier`/`SaleOrderPayment`).
 */
export type FinancialEntryPayment = {
  id: string;
  amountCents: number;
  paidAt: Date;
  paymentMethod: FinancialEntryPaymentMethod;
  cardBrand: string | null;
};

export type FinancialEntryPaymentInput = Optional<
  Omit<FinancialEntryPayment, 'cardBrand'>,
  'id'
> & { cardBrand?: string | null };

export function normalizeFinancialEntryPayments(
  payments: FinancialEntryPaymentInput[] | undefined,
): FinancialEntryPayment[] {
  return (payments ?? []).map((payment) => ({
    id: payment.id ?? randomUUID(),
    amountCents: payment.amountCents,
    paidAt: payment.paidAt,
    paymentMethod: payment.paymentMethod,
    cardBrand: payment.cardBrand?.trim() || null,
  }));
}

export function sumFinancialEntryPayments(
  payments: readonly FinancialEntryPayment[],
): number {
  return payments.reduce((sum, payment) => sum + payment.amountCents, 0);
}
