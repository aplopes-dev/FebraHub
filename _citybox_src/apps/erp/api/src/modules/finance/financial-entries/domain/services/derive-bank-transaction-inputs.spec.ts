import { deriveBankTransactionInputsFromEntry } from './derive-bank-transaction-inputs';
import { FinancialEntry } from '../entities/financial-entry.entity';
import {
  makeFinancialEntry,
  makeFinancialEntryPayment,
} from '../../tests/financial-entries-test-factory';

const BANK_ACCOUNT_ID = 'b1111111-1111-4111-8111-111111111111';

describe('deriveBankTransactionInputsFromEntry', () => {
  it('returns [] when the entry has no bankAccountId', () => {
    const entry = makeFinancialEntry({
      bankAccountId: null,
      payments: [makeFinancialEntryPayment({ amountCents: 5_000 })],
    });

    expect(deriveBankTransactionInputsFromEntry(entry)).toEqual([]);
  });

  it('returns one input per payment, kind=credit for a receivable', () => {
    const entry = makeFinancialEntry({
      operation: 'receivable',
      bankAccountId: BANK_ACCOUNT_ID,
      amountCents: 10_000,
      payments: [
        makeFinancialEntryPayment({ amountCents: 6_000 }),
        makeFinancialEntryPayment({ amountCents: 4_000 }),
      ],
    });

    const inputs = deriveBankTransactionInputsFromEntry(entry);

    expect(inputs).toHaveLength(2);
    expect(inputs.every((input) => input.kind === 'credit')).toBe(true);
    expect(inputs.map((input) => input.amountCents).sort()).toEqual([
      4_000, 6_000,
    ]);
  });

  it('returns one input per payment, kind=debit for a payable', () => {
    const entry = makeFinancialEntry({
      operation: 'payable',
      bankAccountId: BANK_ACCOUNT_ID,
      amountCents: 5_000,
      payments: [makeFinancialEntryPayment({ amountCents: 5_000 })],
    });

    const inputs = deriveBankTransactionInputsFromEntry(entry);

    expect(inputs).toHaveLength(1);
    expect(inputs[0].kind).toBe('debit');
    expect(inputs[0].amountCents).toBe(5_000);
  });

  it('returns a single synthetic input when payments is empty but paidCents > 0 (sale-order shortcut)', () => {
    // `makeFinancialEntry`/`FinancialEntry.create()` sempre recalculam
    // `paidCents` a partir de `payments[]` — o atalho de venda
    // (`maybeCreateReceivable`) grava `paidCents` direto via Prisma sem
    // popular `payments[]`, então simula-se aqui reconstruindo com `with()`
    // (o que o repositório faz ao carregar do banco), sem recomputar nada.
    const base = makeFinancialEntry({
      operation: 'receivable',
      bankAccountId: BANK_ACCOUNT_ID,
      amountCents: 8_000,
      payments: [],
    });
    const saleGenerated = FinancialEntry.with(
      { ...base.props, paidCents: 8_000, payments: [] },
      'sale-generated-id',
    );

    const inputs = deriveBankTransactionInputsFromEntry(saleGenerated);

    expect(inputs).toHaveLength(1);
    expect(inputs[0].kind).toBe('credit');
    expect(inputs[0].amountCents).toBe(8_000);
  });

  it('returns [] when payments is empty and paidCents is 0', () => {
    const entry = makeFinancialEntry({
      bankAccountId: BANK_ACCOUNT_ID,
      payments: [],
    });

    expect(deriveBankTransactionInputsFromEntry(entry)).toEqual([]);
  });
});
