import { describe, expect, it } from 'vitest';
import { MOCK_DASHBOARD_PAYMENT_METHOD_RECEIPTS } from '../data/mock-dashboard-payment-methods';
import {
  filterReceiptsByMethod,
  filterReceiptsByPeriod,
  paymentMethodBarSegments,
  summarizePaymentMethods,
} from './dashboard-payment-methods';

describe('dashboard-payment-methods', () => {
  it('filters by period and method', () => {
    const july = filterReceiptsByPeriod(
      MOCK_DASHBOARD_PAYMENT_METHOD_RECEIPTS,
      '2026-07-01',
      '2026-07-31',
    );
    expect(july.every((row) => row.paidAt.startsWith('2026-07-'))).toBe(true);
    expect(july.length).toBeGreaterThan(0);

    const credit = filterReceiptsByMethod(july, 'credit');
    expect(credit.every((row) => row.paymentMethod === 'credit')).toBe(true);
  });

  it('summarizes all 7 methods with percents totaling ~100 when there is volume', () => {
    const july = filterReceiptsByPeriod(
      MOCK_DASHBOARD_PAYMENT_METHOD_RECEIPTS,
      '2026-07-01',
      '2026-07-31',
    );
    const summary = summarizePaymentMethods(july);
    expect(summary.items).toHaveLength(7);
    expect(summary.totalCents).toBe(
      july.reduce((sum, row) => sum + row.amountCents, 0),
    );
    expect(summary.items.reduce((sum, item) => sum + item.amountCents, 0)).toBe(
      summary.totalCents,
    );

    const percentSum = summary.items.reduce(
      (sum, item) => sum + item.percent,
      0,
    );
    expect(percentSum).toBeGreaterThan(99);
    expect(percentSum).toBeLessThanOrEqual(100.1);

    const credit = summary.items.find((item) => item.method === 'credit');
    const debit = summary.items.find((item) => item.method === 'debit');
    expect(credit?.amountCents).toBeGreaterThan(debit?.amountCents ?? 0);
  });

  it('returns zero percents when empty and bar segments only with value', () => {
    const empty = summarizePaymentMethods([]);
    expect(empty.totalCents).toBe(0);
    expect(empty.items.every((item) => item.percent === 0)).toBe(true);
    expect(paymentMethodBarSegments(empty.items)).toHaveLength(0);

    const july = filterReceiptsByPeriod(
      MOCK_DASHBOARD_PAYMENT_METHOD_RECEIPTS,
      '2026-07-01',
      '2026-07-31',
    );
    const summary = summarizePaymentMethods(july);
    const segments = paymentMethodBarSegments(summary.items);
    expect(segments.every((item) => item.amountCents > 0)).toBe(true);
    expect(segments.length).toBeLessThanOrEqual(7);
  });
});
