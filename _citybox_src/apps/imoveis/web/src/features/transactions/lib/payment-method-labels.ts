import {
  LEAD_PAYMENT_INTENT_LABEL,
  LEAD_PAYMENT_INTENTS,
  type LeadPaymentIntent,
} from '@/features/leads/types';
import type { TransactionPaymentMethod } from '../types';

/** Meios exibidos no dropdown de criação — os mesmos do formulário de lead. */
export const CREATABLE_TRANSACTION_PAYMENT_METHODS = LEAD_PAYMENT_INTENTS;

export type CreatableTransactionPaymentMethod = LeadPaymentIntent;

export const TRANSACTION_PAYMENT_METHOD_LABEL: Record<
  TransactionPaymentMethod,
  string
> = {
  pix: 'PIX',
  transfer: 'Transferência (TED/DOC)',
  boleto: 'Boleto',
  cash: LEAD_PAYMENT_INTENT_LABEL.cash,
  check: 'Cheque',
  debit: 'Cartão de débito',
  credit: 'Cartão de crédito',
  financing: LEAD_PAYMENT_INTENT_LABEL.financing,
  consortium: 'Consórcio',
  fgts: LEAD_PAYMENT_INTENT_LABEL.fgts,
  'trade-in': LEAD_PAYMENT_INTENT_LABEL['trade-in'],
  other: 'Outro',
};

export const TRANSACTION_PAYMENT_METHOD_OPTIONS =
  CREATABLE_TRANSACTION_PAYMENT_METHODS.map((value) => ({
    value,
    label: LEAD_PAYMENT_INTENT_LABEL[value],
  }));

export function paymentMethodLabel(
  method: TransactionPaymentMethod | null | undefined,
): string {
  if (!method) return '—';
  return TRANSACTION_PAYMENT_METHOD_LABEL[method] ?? method;
}
