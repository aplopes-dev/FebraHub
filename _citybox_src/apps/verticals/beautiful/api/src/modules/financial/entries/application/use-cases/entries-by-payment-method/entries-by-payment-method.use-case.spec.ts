import { FinancialEntry } from '../../../domain/entities/financial-entry.entity';
import { InMemoryFinancialEntryRepository } from '../../../tests/in-memory-financial-entry.repository';
import { EntriesByPaymentMethodUseCase } from './entries-by-payment-method.use-case';

describe('EntriesByPaymentMethodUseCase', () => {
  it('aggregates settled entries by payment method (income/expense/balance)', async () => {
    const repository = new InMemoryFinancialEntryRepository();
    repository.seed([
      FinancialEntry.create({
        storeId: 'store-1',
        type: 'income',
        source: 'manual',
        description: 'Pix receita',
        valueCents: 10000,
        dueDate: new Date('2026-07-01T00:00:00.000Z'),
        status: 'received',
        paidAt: new Date('2026-07-02T00:00:00.000Z'),
        paymentMethod: 'pix',
      }),
      FinancialEntry.create({
        storeId: 'store-1',
        type: 'expense',
        source: 'manual',
        description: 'Pix despesa',
        valueCents: 3000,
        dueDate: new Date('2026-07-03T00:00:00.000Z'),
        status: 'paid',
        paidAt: new Date('2026-07-04T00:00:00.000Z'),
        paymentMethod: 'pix',
      }),
      FinancialEntry.create({
        storeId: 'store-1',
        type: 'income',
        source: 'manual',
        description: 'Cash',
        valueCents: 5000,
        dueDate: new Date('2026-07-05T00:00:00.000Z'),
        status: 'received',
        paidAt: new Date('2026-07-05T00:00:00.000Z'),
        paymentMethod: 'cash',
      }),
      FinancialEntry.create({
        storeId: 'store-1',
        type: 'income',
        source: 'manual',
        description: 'Pendente',
        valueCents: 99999,
        dueDate: new Date('2026-07-06T00:00:00.000Z'),
        status: 'pending',
        paymentMethod: 'pix',
      }),
      FinancialEntry.create({
        storeId: 'store-1',
        type: 'income',
        source: 'manual',
        description: 'Sem método',
        valueCents: 1000,
        dueDate: new Date('2026-07-07T00:00:00.000Z'),
        status: 'received',
        paidAt: new Date('2026-07-07T00:00:00.000Z'),
        paymentMethod: null,
      }),
    ]);

    const useCase = new EntriesByPaymentMethodUseCase(repository);
    const result = await useCase.execute({
      storeId: 'store-1',
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      dateField: 'paidAt',
    });

    expect(result.data).toEqual([
      {
        paymentMethod: 'cash',
        incomeCents: 5000,
        expenseCents: 0,
        balanceCents: 5000,
      },
      {
        paymentMethod: 'pix',
        incomeCents: 10000,
        expenseCents: 3000,
        balanceCents: 7000,
      },
    ]);
  });

  it('filters by paidAtFrom for scheduled settlements', async () => {
    const repository = new InMemoryFinancialEntryRepository();
    repository.seed([
      FinancialEntry.create({
        storeId: 'store-1',
        type: 'income',
        source: 'manual',
        description: 'Hoje',
        valueCents: 1000,
        dueDate: new Date('2026-07-10T00:00:00.000Z'),
        status: 'received',
        paidAt: new Date('2026-07-10T00:00:00.000Z'),
        paymentMethod: 'pix',
      }),
      FinancialEntry.create({
        storeId: 'store-1',
        type: 'income',
        source: 'manual',
        description: 'Futuro',
        valueCents: 2000,
        dueDate: new Date('2026-07-10T00:00:00.000Z'),
        status: 'received',
        paidAt: new Date('2026-07-20T00:00:00.000Z'),
        paymentMethod: 'pix',
      }),
    ]);

    const useCase = new EntriesByPaymentMethodUseCase(repository);
    const result = await useCase.execute({
      storeId: 'store-1',
      dateField: 'paidAt',
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      paidAtFrom: '2026-07-11',
    });

    expect(result.data).toEqual([
      {
        paymentMethod: 'pix',
        incomeCents: 2000,
        expenseCents: 0,
        balanceCents: 2000,
      },
    ]);
  });
});
