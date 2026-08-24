import {
  calculateDiscountCents,
  calculateFinalValueCents,
  calculateInstallmentAmountCents,
  calculateInstallmentBalanceCents,
  distributeInstallmentAmounts,
  sumBudgetItemCents,
  validateInstallmentSum,
} from './budget-pricing.utils';

describe('budget-pricing.utils', () => {
  describe('sumBudgetItemCents', () => {
    it('sums item values', () => {
      expect(
        sumBudgetItemCents([
          { valueCents: 1000 },
          { valueCents: 2500 },
          { valueCents: 500 },
        ]),
      ).toBe(4000);
    });
  });

  describe('calculateDiscountCents', () => {
    it('applies fixed discount capped at subtotal', () => {
      expect(calculateDiscountCents(5000, { type: 'fixed', value: 1200 })).toBe(
        1200,
      );
      expect(calculateDiscountCents(5000, { type: 'fixed', value: 9000 })).toBe(
        5000,
      );
    });

    it('applies percent discount rounded to cents (centesimal: 1000 = 10%)', () => {
      expect(
        calculateDiscountCents(10000, { type: 'percent', value: 1000 }),
      ).toBe(1000);
      expect(
        calculateDiscountCents(9999, { type: 'percent', value: 1000 }),
      ).toBe(1000);
      expect(
        calculateDiscountCents(10000, { type: 'percent', value: 1050 }),
      ).toBe(1050);
    });

    it('does not wipe the total when percent is 20% (value 2000)', () => {
      expect(
        calculateDiscountCents(50_000, { type: 'percent', value: 2000 }),
      ).toBe(10_000);
      expect(
        calculateFinalValueCents(50_000, { type: 'percent', value: 2000 }),
      ).toBe(40_000);
    });

    it('returns zero when discount is null', () => {
      expect(calculateDiscountCents(5000, null)).toBe(0);
    });
  });

  describe('calculateFinalValueCents', () => {
    it('subtracts discount from subtotal', () => {
      expect(
        calculateFinalValueCents(10000, { type: 'percent', value: 1500 }),
      ).toBe(8500);
    });
  });

  describe('installments', () => {
    it('calculates balance and rounded installment amount', () => {
      expect(calculateInstallmentBalanceCents(10000, 2000)).toBe(8000);
      expect(calculateInstallmentAmountCents(8000, 3)).toBe(2667);
    });

    it('distributes cents with last installment absorbing remainder', () => {
      expect(distributeInstallmentAmounts(10000, 3)).toEqual([
        3333, 3333, 3334,
      ]);
      expect(distributeInstallmentAmounts(10001, 3)).toEqual([
        3333, 3333, 3335,
      ]);
    });

    it('validates installment sum when enabled', () => {
      expect(() =>
        validateInstallmentSum({
          finalValueCents: 10000,
          downPaymentCents: 1000,
          installmentsCount: 3,
          installmentEnabled: true,
        }),
      ).not.toThrow();
    });

    it('requires zero down payment and count when disabled', () => {
      expect(() =>
        validateInstallmentSum({
          finalValueCents: 10000,
          downPaymentCents: 0,
          installmentsCount: 0,
          installmentEnabled: false,
        }),
      ).not.toThrow();

      expect(() =>
        validateInstallmentSum({
          finalValueCents: 10000,
          downPaymentCents: 100,
          installmentsCount: 0,
          installmentEnabled: false,
        }),
      ).toThrow('INSTALLMENT_DISABLED_MUST_BE_ZERO');
    });

    it('rejects invalid installment configuration', () => {
      expect(() =>
        validateInstallmentSum({
          finalValueCents: 10000,
          downPaymentCents: 1000,
          installmentsCount: 0,
          installmentEnabled: true,
        }),
      ).toThrow('INSTALLMENT_COUNT_REQUIRED');
    });
  });
});
