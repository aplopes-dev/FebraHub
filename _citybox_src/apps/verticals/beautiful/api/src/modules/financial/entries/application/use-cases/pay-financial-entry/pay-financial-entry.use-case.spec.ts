import { FinancialEntry } from '../../../domain/entities/financial-entry.entity';
import { FinancialEntryFrozenError } from '../../../domain/errors/financial-entry-frozen.error';
import { InMemoryFinancialEntryRepository } from '../../../tests/in-memory-financial-entry.repository';
import { PayFinancialEntryUseCase } from './pay-financial-entry.use-case';

describe('PayFinancialEntryUseCase', () => {
  const storeId = 'store-1';
  let repository: InMemoryFinancialEntryRepository;
  let useCase: PayFinancialEntryUseCase;
  let pendingExpense: FinancialEntry;

  beforeEach(() => {
    repository = new InMemoryFinancialEntryRepository();
    pendingExpense = FinancialEntry.create({
      storeId,
      type: 'expense',
      source: 'manual',
      description: 'Aluguel',
      valueCents: 200000,
      dueDate: new Date('2026-07-10T00:00:00.000Z'),
      status: 'pending',
    });
    repository.seed([pendingExpense]);
    useCase = new PayFinancialEntryUseCase(repository);
  });

  it('pays a pending expense entry', async () => {
    const updated = await useCase.execute({
      storeId,
      entryId: pendingExpense.id,
      paymentMethod: 'transfer',
      accountId: 'acc-1',
      paidValueCents: 200000,
      settledAt: '2026-07-10',
    });

    expect(updated.status).toBe('paid');
    expect(updated.paymentMethod).toBe('transfer');
  });

  it('rejects pay on already paid entry', async () => {
    const paid = pendingExpense.withPaid({
      paidAt: new Date('2026-07-10T00:00:00.000Z'),
      paidValueCents: 200000,
      paymentMethod: 'pix',
      accountId: 'acc-1',
      receiveDetail: {
        paymentMethod: 'pix',
        accountId: 'acc-1',
        paidValueCents: 200000,
      },
    });
    repository.seed([paid]);

    await expect(
      useCase.execute({
        storeId,
        entryId: paid.id,
        paymentMethod: 'pix',
        accountId: 'acc-1',
        paidValueCents: 200000,
        settledAt: '2026-07-11',
      }),
    ).rejects.toBeInstanceOf(FinancialEntryFrozenError);
  });
});
