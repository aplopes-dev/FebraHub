import { FinancialEntry } from '../../../domain/entities/financial-entry.entity';
import { FinancialEntryFrozenError } from '../../../domain/errors/financial-entry-frozen.error';
import { FinancialEntryLinkedToCommissionError } from '../../../domain/errors/financial-entry-linked-to-commission.error';
import { InMemoryFinancialEntryRepository } from '../../../tests/in-memory-financial-entry.repository';
import { CancelFinancialEntryUseCase } from './cancel-financial-entry.use-case';

const ACTOR = {
  sub: 'user-42',
  roles: ['store_member'],
  name: 'Maria Silva',
  email: 'maria@clinic.local',
};

describe('CancelFinancialEntryUseCase', () => {
  it('unsettles received income back to pending and clears payment fields', async () => {
    const repository = new InMemoryFinancialEntryRepository();
    repository.seed([
      FinancialEntry.create(
        {
          storeId: 'store-1',
          type: 'income',
          source: 'manual',
          description: 'Receita',
          valueCents: 25000,
          dueDate: new Date('2026-07-01T00:00:00.000Z'),
          status: 'received',
          paidAt: new Date('2026-07-02T00:00:00.000Z'),
          paidValueCents: 25000,
          paymentMethod: 'pix',
          accountId: 'acc-1',
          paymentType: 'full',
          receiveDetail: {
            paymentMethod: 'pix',
            accountId: 'acc-1',
            paidValueCents: 25000,
          },
          cancelledById: 'old',
          cancelledByName: 'Antigo',
        },
        'entry-1',
      ),
    ]);

    const useCase = new CancelFinancialEntryUseCase(repository);
    const result = await useCase.execute({
      storeId: 'store-1',
      entryId: 'entry-1',
      actor: ACTOR,
    });

    expect(result.status).toBe('pending');
    expect(result.paidAt).toBeNull();
    expect(result.paidValueCents).toBeNull();
    expect(result.paymentMethod).toBeNull();
    expect(result.accountId).toBeNull();
    expect(result.paymentType).toBeNull();
    expect(result.receiveDetail).toBeNull();
    expect(result.cancelledById).toBeNull();
    expect(result.cancelledByName).toBeNull();
    expect(result.isOverdue(new Date('2026-07-10T00:00:00.000Z'))).toBe(true);
  });

  it('unsettles paid expense back to pending', async () => {
    const repository = new InMemoryFinancialEntryRepository();
    repository.seed([
      FinancialEntry.create(
        {
          storeId: 'store-1',
          type: 'expense',
          source: 'manual',
          description: 'Despesa',
          valueCents: 1000,
          dueDate: new Date('2026-08-10T00:00:00.000Z'),
          status: 'paid',
          paidAt: new Date('2026-08-01T00:00:00.000Z'),
          paidValueCents: 1000,
          paymentMethod: 'cash',
          accountId: 'acc-2',
        },
        'entry-exp',
      ),
    ]);

    const useCase = new CancelFinancialEntryUseCase(repository);
    const result = await useCase.execute({
      storeId: 'store-1',
      entryId: 'entry-exp',
      actor: ACTOR,
    });

    expect(result.status).toBe('pending');
    expect(result.isOverdue(new Date('2026-08-05T00:00:00.000Z'))).toBe(false);
  });

  it('rejects already cancelled entries', async () => {
    const repository = new InMemoryFinancialEntryRepository();
    repository.seed([
      FinancialEntry.create(
        {
          storeId: 'store-1',
          type: 'income',
          source: 'manual',
          description: 'Já cancelada',
          valueCents: 100,
          dueDate: new Date('2026-07-01T00:00:00.000Z'),
          status: 'cancelled',
          cancelledById: 'old',
          cancelledByName: 'Antigo',
        },
        'entry-done',
      ),
    ]);

    const useCase = new CancelFinancialEntryUseCase(repository);

    await expect(
      useCase.execute({
        storeId: 'store-1',
        entryId: 'entry-done',
        actor: ACTOR,
      }),
    ).rejects.toBeInstanceOf(FinancialEntryFrozenError);
  });

  it('rejects pending entries (cancel only undoes settlement)', async () => {
    const repository = new InMemoryFinancialEntryRepository();
    repository.seed([
      FinancialEntry.create(
        {
          storeId: 'store-1',
          type: 'income',
          source: 'manual',
          description: 'Ainda pendente',
          valueCents: 100,
          dueDate: new Date('2026-07-01T00:00:00.000Z'),
          status: 'pending',
        },
        'entry-pending',
      ),
    ]);

    const useCase = new CancelFinancialEntryUseCase(repository);

    await expect(
      useCase.execute({
        storeId: 'store-1',
        entryId: 'entry-pending',
        actor: ACTOR,
      }),
    ).rejects.toBeInstanceOf(FinancialEntryFrozenError);
  });

  it('blocks cancel when entry is linked to commission', async () => {
    const repository = new InMemoryFinancialEntryRepository();
    repository.seed([
      FinancialEntry.create(
        {
          storeId: 'store-1',
          type: 'income',
          source: 'manual',
          description: 'Com comissão',
          valueCents: 5000,
          dueDate: new Date('2026-07-01T00:00:00.000Z'),
          status: 'received',
        },
        'entry-comm',
      ),
    ]);
    repository.markLinkedToCommission('entry-comm');

    const useCase = new CancelFinancialEntryUseCase(repository);

    await expect(
      useCase.execute({
        storeId: 'store-1',
        entryId: 'entry-comm',
        actor: ACTOR,
      }),
    ).rejects.toBeInstanceOf(FinancialEntryLinkedToCommissionError);
  });
});
