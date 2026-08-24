import { FinancialEntry } from '../../../domain/entities/financial-entry.entity';
import { InMemoryFinancialEntryRepository } from '../../../tests/in-memory-financial-entry.repository';
import { StatsFinancialEntriesUseCase } from './stats-financial-entries.use-case';

describe('StatsFinancialEntriesUseCase', () => {
  it('computes income/expense totals ignoring cancelled', async () => {
    const repository = new InMemoryFinancialEntryRepository();
    repository.seed([
      FinancialEntry.create({
        storeId: 'store-1',
        type: 'income',
        source: 'manual',
        description: 'Recebido',
        valueCents: 10000,
        dueDate: new Date('2026-07-01T00:00:00.000Z'),
        status: 'received',
      }),
      FinancialEntry.create({
        storeId: 'store-1',
        type: 'income',
        source: 'manual',
        description: 'A receber',
        valueCents: 5000,
        dueDate: new Date('2026-07-10T00:00:00.000Z'),
        status: 'pending',
      }),
      FinancialEntry.create({
        storeId: 'store-1',
        type: 'expense',
        source: 'manual',
        description: 'Pago',
        valueCents: 3000,
        dueDate: new Date('2026-07-05T00:00:00.000Z'),
        status: 'paid',
      }),
      FinancialEntry.create({
        storeId: 'store-1',
        type: 'expense',
        source: 'manual',
        description: 'A pagar',
        valueCents: 2000,
        dueDate: new Date('2026-07-20T00:00:00.000Z'),
        status: 'pending',
      }),
      FinancialEntry.create({
        storeId: 'store-1',
        type: 'income',
        source: 'manual',
        description: 'Cancelado',
        valueCents: 99999,
        dueDate: new Date('2026-07-15T00:00:00.000Z'),
        status: 'cancelled',
      }),
    ]);

    const useCase = new StatsFinancialEntriesUseCase(repository);
    const result = await useCase.execute({
      storeId: 'store-1',
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    });

    expect(result.data).toEqual({
      income: { received: 10000, toReceive: 5000, total: 15000 },
      expense: { paid: 3000, toPay: 2000, total: 5000 },
      balance: { current: 7000, projected: 10000 },
    });
  });

  it('filters by dueDate range and ignores other stores', async () => {
    const repository = new InMemoryFinancialEntryRepository();
    repository.seed([
      FinancialEntry.create({
        storeId: 'store-1',
        type: 'income',
        source: 'manual',
        description: 'Dentro do mês',
        valueCents: 8000,
        dueDate: new Date('2026-07-15T00:00:00.000Z'),
        status: 'received',
      }),
      FinancialEntry.create({
        storeId: 'store-1',
        type: 'income',
        source: 'manual',
        description: 'Fora do mês',
        valueCents: 50000,
        dueDate: new Date('2026-06-30T00:00:00.000Z'),
        status: 'received',
      }),
      FinancialEntry.create({
        storeId: 'store-2',
        type: 'income',
        source: 'manual',
        description: 'Outra loja',
        valueCents: 90000,
        dueDate: new Date('2026-07-10T00:00:00.000Z'),
        status: 'received',
      }),
      FinancialEntry.create({
        storeId: 'store-1',
        type: 'expense',
        source: 'manual',
        description: 'Despesa no mês',
        valueCents: 2500,
        dueDate: new Date('2026-07-31T00:00:00.000Z'),
        status: 'paid',
      }),
    ]);

    const useCase = new StatsFinancialEntriesUseCase(repository);
    const result = await useCase.execute({
      storeId: 'store-1',
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    });

    expect(result.data).toEqual({
      income: { received: 8000, toReceive: 0, total: 8000 },
      expense: { paid: 2500, toPay: 0, total: 2500 },
      balance: { current: 5500, projected: 5500 },
    });
  });
});
