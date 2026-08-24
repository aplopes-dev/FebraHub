import { FinancialEntry } from '../../../domain/entities/financial-entry.entity';
import { InMemoryFinancialEntryRepository } from '../../../tests/in-memory-financial-entry.repository';
import { DeleteFinancialEntryUseCase } from './delete-financial-entry.use-case';

describe('DeleteFinancialEntryUseCase', () => {
  it('deletes pending entries', async () => {
    const repository = new InMemoryFinancialEntryRepository();
    repository.seed([
      FinancialEntry.create(
        {
          storeId: 'store-1',
          type: 'expense',
          source: 'manual',
          description: 'Pendente',
          valueCents: 1000,
          dueDate: new Date('2026-07-01T00:00:00.000Z'),
          status: 'pending',
        },
        'entry-pending',
      ),
    ]);

    const useCase = new DeleteFinancialEntryUseCase(repository);
    await useCase.execute({ storeId: 'store-1', entryId: 'entry-pending' });

    expect(await repository.findById('store-1', 'entry-pending')).toBeNull();
  });

  it('allows deleting settled paid/received entries', async () => {
    const repository = new InMemoryFinancialEntryRepository();
    repository.seed([
      FinancialEntry.create(
        {
          storeId: 'store-1',
          type: 'expense',
          source: 'manual',
          description: 'Pago',
          valueCents: 2000,
          dueDate: new Date('2026-07-01T00:00:00.000Z'),
          status: 'paid',
          paidAt: new Date('2026-07-02T00:00:00.000Z'),
          paymentMethod: 'pix',
        },
        'entry-paid',
      ),
      FinancialEntry.create(
        {
          storeId: 'store-1',
          type: 'income',
          source: 'manual',
          description: 'Recebido',
          valueCents: 3000,
          dueDate: new Date('2026-07-01T00:00:00.000Z'),
          status: 'received',
          paidAt: new Date('2026-07-02T00:00:00.000Z'),
          paymentMethod: 'cash',
        },
        'entry-received',
      ),
    ]);

    const useCase = new DeleteFinancialEntryUseCase(repository);
    await useCase.execute({ storeId: 'store-1', entryId: 'entry-paid' });
    await useCase.execute({ storeId: 'store-1', entryId: 'entry-received' });

    expect(await repository.findById('store-1', 'entry-paid')).toBeNull();
    expect(await repository.findById('store-1', 'entry-received')).toBeNull();
  });
});
