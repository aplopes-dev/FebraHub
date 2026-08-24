import { describe, expect, it } from 'vitest';
import {
  buildExpenseCategoryCashFlowHref,
  buildOverdueIncomeCashFlowHref,
  getYesterdayLocalDate,
  parseCashFlowDeepLink,
} from './cash-flow-deep-link';

describe('cash-flow-deep-link', () => {
  const referenceDate = new Date(2026, 6, 17);

  it('builds href with income + unpaid + custom period ending yesterday', () => {
    const href = buildOverdueIncomeCashFlowHref(referenceDate);

    expect(href).toContain('/financeiro/fluxo-de-caixa?');
    expect(href).toContain('types=income');
    expect(href).toContain('statuses=unpaid');
    expect(href).toContain('period=custom');
    expect(href).toContain('endDate=2026-07-16');
    expect(href).toContain('startDate=2025-07-17');
  });

  it('builds href with expense + category + custom period', () => {
    const href = buildExpenseCategoryCashFlowHref({
      categoryId: 'exp-cat-labs',
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    });

    expect(href).toContain('/financeiro/fluxo-de-caixa?');
    expect(href).toContain('types=expense');
    expect(href).toContain('categories=exp-cat-labs');
    expect(href).toContain('period=custom');
    expect(href).toContain('startDate=2026-07-01');
    expect(href).toContain('endDate=2026-07-31');
  });

  it('parses valid deep-link params', () => {
    const params = new URLSearchParams(
      'types=income&statuses=unpaid&period=custom&startDate=2025-07-17&endDate=2026-07-16',
    );

    expect(parseCashFlowDeepLink(params)).toEqual({
      period: 'custom',
      startDate: '2025-07-17',
      endDate: '2026-07-16',
      filters: {
        types: ['income'],
        statuses: ['unpaid'],
        categories: [],
      },
    });
  });

  it('parses expense category deep-link params', () => {
    const params = new URLSearchParams(
      'types=expense&categories=exp-cat-labs&period=custom&startDate=2026-07-01&endDate=2026-07-31',
    );

    expect(parseCashFlowDeepLink(params)).toEqual({
      period: 'custom',
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      filters: {
        types: ['expense'],
        statuses: [],
        categories: ['exp-cat-labs'],
      },
    });
  });

  it('returns null when there are no deep-link params', () => {
    expect(parseCashFlowDeepLink(new URLSearchParams())).toBeNull();
  });

  it('computes yesterday on local calendar', () => {
    expect(getYesterdayLocalDate(referenceDate)).toBe('2026-07-16');
  });
});
