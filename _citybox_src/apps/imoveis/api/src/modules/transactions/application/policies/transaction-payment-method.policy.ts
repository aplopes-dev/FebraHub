import type { TransactionPaymentMethod } from '../../domain/entities/transaction.entity';

/** Meios do dropdown de criação — iguais à intenção de pagamento do lead. */
export const CREATABLE_TRANSACTION_PAYMENT_METHODS = [
  'cash',
  'financing',
  'fgts',
  'trade-in',
] as const satisfies readonly TransactionPaymentMethod[];

/** Meios aceitos em `POST /v1/transactions` (dropdown de criação). */
export const TRANSACTION_PAYMENT_METHODS: readonly TransactionPaymentMethod[] =
  CREATABLE_TRANSACTION_PAYMENT_METHODS;

export const TRANSACTION_PAYMENT_METHOD_LABEL: Record<
  TransactionPaymentMethod,
  string
> = {
  pix: 'PIX',
  transfer: 'Transferência (TED/DOC)',
  boleto: 'Boleto',
  cash: 'À vista',
  check: 'Cheque',
  debit: 'Cartão de débito',
  credit: 'Cartão de crédito',
  financing: 'Financiamento bancário',
  consortium: 'Consórcio',
  fgts: 'FGTS',
  'trade-in': 'Permuta / dação de imóvel',
  other: 'Outro',
};

export function paymentMethodLabel(method: TransactionPaymentMethod): string {
  return TRANSACTION_PAYMENT_METHOD_LABEL[method];
}

export function isTransactionPaymentMethod(
  value: string,
): value is TransactionPaymentMethod {
  return value in TRANSACTION_PAYMENT_METHOD_LABEL;
}

export function paymentMethodToPrisma(
  method: TransactionPaymentMethod,
): Exclude<TransactionPaymentMethod, 'trade-in'> | 'trade_in' {
  return method === 'trade-in' ? 'trade_in' : method;
}

export function paymentMethodToApi(
  method: string,
): TransactionPaymentMethod {
  if (method === 'trade_in') return 'trade-in';
  return method as TransactionPaymentMethod;
}
