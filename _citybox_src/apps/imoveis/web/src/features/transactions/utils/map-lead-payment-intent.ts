import type { LeadPaymentIntent } from '@/features/leads/types';
import {
  CREATABLE_TRANSACTION_PAYMENT_METHODS,
  type CreatableTransactionPaymentMethod,
} from '../lib/payment-method-labels';

/** Primeira intenção do lead → meio pré-selecionado no modal de fechamento. */
export function mapLeadPaymentIntentsToTransactionMethod(
  intents: readonly LeadPaymentIntent[] | undefined,
): CreatableTransactionPaymentMethod | undefined {
  const first = intents?.[0];
  if (!first) return undefined;
  if (
    !(CREATABLE_TRANSACTION_PAYMENT_METHODS as readonly string[]).includes(first)
  ) {
    return undefined;
  }
  return first;
}

export function asCreatablePaymentMethod(
  method: string | undefined,
): CreatableTransactionPaymentMethod | '' {
  if (
    method &&
    (CREATABLE_TRANSACTION_PAYMENT_METHODS as readonly string[]).includes(method)
  ) {
    return method as CreatableTransactionPaymentMethod;
  }
  return '';
}
