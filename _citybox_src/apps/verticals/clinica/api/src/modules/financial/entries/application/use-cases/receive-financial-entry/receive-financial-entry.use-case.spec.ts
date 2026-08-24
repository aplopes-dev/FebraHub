import { FinancialEntry } from '../../../domain/entities/financial-entry.entity';
import { FinancialEntryFrozenError } from '../../../domain/errors/financial-entry-frozen.error';
import { InMemoryFinancialEntryRepository } from '../../../tests/in-memory-financial-entry.repository';
import { ReceiveFinancialEntryUseCase } from './receive-financial-entry.use-case';

describe('ReceiveFinancialEntryUseCase', () => {
  const storeId = 'store-1';
  let repository: InMemoryFinancialEntryRepository;
  let useCase: ReceiveFinancialEntryUseCase;
  let pendingIncome: FinancialEntry;

  beforeEach(() => {
    repository = new InMemoryFinancialEntryRepository();
    pendingIncome = FinancialEntry.create({
      storeId,
      type: 'income',
      source: 'manual',
      description: 'Consulta',
      valueCents: 10000,
      dueDate: new Date('2026-07-10T00:00:00.000Z'),
      status: 'pending',
    });
    repository.seed([pendingIncome]);
    useCase = new ReceiveFinancialEntryUseCase(repository, {
      execute: async () => undefined,
    } as never);
  });

  it('receives a pending income entry', async () => {
    const updated = await useCase.execute({
      storeId,
      entryId: pendingIncome.id,
      paymentMethod: 'pix',
      accountId: 'acc-1',
      paidValueCents: 10000,
      settledAt: '2026-07-11',
    });

    expect(updated.status).toBe('received');
    expect(updated.paidValueCents).toBe(10000);
    expect(updated.accountId).toBe('acc-1');
  });

  it('rejects receive on expense', async () => {
    const expense = FinancialEntry.create({
      storeId,
      type: 'expense',
      source: 'manual',
      description: 'Compra',
      valueCents: 1000,
      dueDate: new Date('2026-07-10T00:00:00.000Z'),
      status: 'pending',
    });
    repository.seed([expense]);

    await expect(
      useCase.execute({
        storeId,
        entryId: expense.id,
        paymentMethod: 'pix',
        accountId: 'acc-1',
        paidValueCents: 1000,
        settledAt: '2026-07-11',
      }),
    ).rejects.toBeInstanceOf(FinancialEntryFrozenError);
  });
});
