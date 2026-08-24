export type PaymentMethodId = 'cash' | 'credit' | 'debit' | 'pix';

export type PaymentMethod = {
  id: PaymentMethodId;
  label: string;
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethodId, string> = {
  cash: 'Dinheiro',
  credit: 'Crédito',
  debit: 'Débito',
  pix: 'PIX',
};
