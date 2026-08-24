import {
  normalizePaymentIntents,
  paymentIntentsToApi,
  paymentIntentsToPrisma,
} from './lead-enum.mapper';

describe('lead payment intents mapper', () => {
  it('omite lista vazia ou ausente', () => {
    expect(normalizePaymentIntents()).toEqual([]);
    expect(normalizePaymentIntents([])).toEqual([]);
  });

  it('deduplica e ordena no canônico kebab', () => {
    expect(
      normalizePaymentIntents(['fgts', 'cash', 'fgts', 'financing']),
    ).toEqual(['cash', 'financing', 'fgts']);
  });

  it('mapeia trade-in kebab ↔ trade_in Prisma', () => {
    expect(paymentIntentsToPrisma(['trade-in', 'cash'])).toEqual([
      'cash',
      'trade_in',
    ]);
    expect(paymentIntentsToApi(['trade_in', 'financing'])).toEqual([
      'financing',
      'trade-in',
    ]);
  });
});
