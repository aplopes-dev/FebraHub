import { FinancialEntry } from './financial-entry.entity';
import {
  makeFinancialEntry,
  makeFinancialEntryPayment,
} from '../../tests/financial-entries-test-factory';

/**
 * 006-bank-reconciliation, research.md D4: `addPayment`/`removePayment` são
 * os únicos métodos de escrita da entidade que ignoram `isReadOnly` de
 * propósito — conciliar um recebível de venda precisa continuar possível.
 */
describe('FinancialEntry.addPayment / removePayment', () => {
  it('adiciona um pagamento e recalcula paidCents/status', () => {
    const entry = makeFinancialEntry({ amountCents: 10_000 });
    expect(entry.status).toBe('pending');

    const updated = entry.addPayment(
      makeFinancialEntryPayment({ id: 'p1', amountCents: 10_000 }),
    );

    expect(updated.paidCents).toBe(10_000);
    expect(updated.status).toBe('paid');
    expect(updated.payments).toHaveLength(1);
    expect(updated.payments[0].id).toBe('p1');
  });

  it('funciona mesmo em lançamento isReadOnly (vinculado a venda)', () => {
    const base = makeFinancialEntry({ amountCents: 10_000 });
    const readOnlyEntry = FinancialEntry.with(
      { ...base.props, saleOrderId: 'so-1111-1111-1111-1111-111111111111' },
      base.id,
    );
    expect(readOnlyEntry.isReadOnly).toBe(true);

    const updated = readOnlyEntry.addPayment(
      makeFinancialEntryPayment({ id: 'p1', amountCents: 10_000 }),
    );

    expect(updated.status).toBe('paid');
    // Dados descritivos não mudam — só payments/paidCents/status (FR-021).
    expect(updated.amountCents).toBe(readOnlyEntry.amountCents);
    expect(updated.dueDate).toEqual(readOnlyEntry.dueDate);
  });

  it('preserva pagamentos já existentes ao adicionar outro', () => {
    const entry = makeFinancialEntry({
      amountCents: 20_000,
      payments: [makeFinancialEntryPayment({ id: 'p1', amountCents: 10_000 })],
    });

    const updated = entry.addPayment(
      makeFinancialEntryPayment({ id: 'p2', amountCents: 10_000 }),
    );

    expect(updated.payments).toHaveLength(2);
    expect(updated.paidCents).toBe(20_000);
    expect(updated.status).toBe('paid');
  });

  it('removePayment volta paidCents/status ao estado anterior', () => {
    const entry = makeFinancialEntry({
      amountCents: 10_000,
      payments: [makeFinancialEntryPayment({ id: 'p1', amountCents: 10_000 })],
    });
    expect(entry.status).toBe('paid');

    const updated = entry.removePayment('p1');

    expect(updated.payments).toHaveLength(0);
    expect(updated.paidCents).toBe(0);
    expect(updated.status).toBe('pending');
  });

  it('removePayment funciona mesmo em lançamento isReadOnly', () => {
    const base = makeFinancialEntry({
      amountCents: 10_000,
      payments: [makeFinancialEntryPayment({ id: 'p1', amountCents: 10_000 })],
    });
    const readOnlyEntry = FinancialEntry.with(
      { ...base.props, saleOrderId: 'so-1111-1111-1111-1111-111111111111' },
      base.id,
    );

    const updated = readOnlyEntry.removePayment('p1');

    expect(updated.status).toBe('pending');
  });

  it('removePayment lança se o id não existir entre os pagamentos atuais', () => {
    const entry = makeFinancialEntry({
      payments: [makeFinancialEntryPayment({ id: 'p1' })],
    });

    expect(() => entry.removePayment('does-not-exist')).toThrow();
  });
});
