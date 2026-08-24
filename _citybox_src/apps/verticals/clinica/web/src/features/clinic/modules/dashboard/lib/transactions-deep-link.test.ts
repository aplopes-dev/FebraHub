import { describe, expect, it } from 'vitest';
import {
  buildPaymentMethodTransactionsHref,
  parseTransactionsDeepLink,
  TRANSACTIONS_PATH,
} from './transactions-deep-link';

describe('transactions-deep-link', () => {
  it('builds href with income + payment method + transactions view', () => {
    const href = buildPaymentMethodTransactionsHref({
      paymentMethod: 'credit',
      period: 'this_month',
    });

    expect(href.startsWith(`${TRANSACTIONS_PATH}?`)).toBe(true);
    expect(href).toContain('types=income');
    expect(href).toContain('paymentMethods=credit');
    expect(href).toContain('view=transactions');
    expect(href).toContain('period=this_month');
  });

  it('includes custom dates when period is custom', () => {
    const href = buildPaymentMethodTransactionsHref({
      paymentMethod: 'pix',
      period: 'custom',
      startDate: '2026-07-01',
      endDate: '2026-07-15',
    });

    expect(href).toContain('period=custom');
    expect(href).toContain('startDate=2026-07-01');
    expect(href).toContain('endDate=2026-07-15');
  });

  it('parses valid deep-link params', () => {
    const params = new URLSearchParams(
      'types=income&paymentMethods=debit&view=transactions&period=this_week',
    );

    expect(parseTransactionsDeepLink(params)).toEqual({
      period: 'this_week',
      startDate: null,
      endDate: null,
      viewMode: 'transactions',
      filters: {
        types: ['income'],
        paymentMethods: ['debit'],
      },
    });
  });

  it('returns null when there are no deep-link params', () => {
    expect(parseTransactionsDeepLink(new URLSearchParams())).toBeNull();
  });
});
