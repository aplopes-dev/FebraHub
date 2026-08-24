import {
  CREATABLE_TRANSACTION_PAYMENT_METHODS,
  paymentMethodLabel,
  paymentMethodToApi,
  paymentMethodToPrisma,
} from './transaction-payment-method.policy';

describe('transaction payment method policy', () => {
  it('create dropdown matches lead payment intents', () => {
    expect([...CREATABLE_TRANSACTION_PAYMENT_METHODS]).toEqual([
      'cash',
      'financing',
      'fgts',
      'trade-in',
    ]);
  });

  it('maps trade-in kebab ↔ Prisma trade_in', () => {
    expect(paymentMethodToPrisma('trade-in')).toBe('trade_in');
    expect(paymentMethodToApi('trade_in')).toBe('trade-in');
    expect(paymentMethodToPrisma('cash')).toBe('cash');
    expect(paymentMethodToApi('financing')).toBe('financing');
  });

  it('uses the same labels as the lead form for creatable methods', () => {
    expect(paymentMethodLabel('cash')).toBe('À vista');
    expect(paymentMethodLabel('financing')).toBe('Financiamento bancário');
    expect(paymentMethodLabel('fgts')).toBe('FGTS');
    expect(paymentMethodLabel('trade-in')).toBe('Permuta / dação de imóvel');
  });
});
