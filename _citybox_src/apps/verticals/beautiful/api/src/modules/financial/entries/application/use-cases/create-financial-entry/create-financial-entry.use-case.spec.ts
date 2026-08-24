import { CreateFinancialEntryUseCase } from './create-financial-entry.use-case';
import { InMemoryFinancialEntryRepository } from '../../../tests/in-memory-financial-entry.repository';
import { toIsoDateOnly } from '../../utils/financial-entry.utils';

describe('CreateFinancialEntryUseCase', () => {
  const storeId = 'store-1';
  let repository: InMemoryFinancialEntryRepository;
  let useCase: CreateFinancialEntryUseCase;

  beforeEach(() => {
    repository = new InMemoryFinancialEntryRepository();
    useCase = new CreateFinancialEntryUseCase(repository);
  });

  it('creates a pending manual income entry', async () => {
    const [entry] = await useCase.execute({
      storeId,
      type: 'income',
      description: 'Consulta',
      valueCents: 15000,
      dueDate: '2026-07-15',
      incomeCategoryId: 'cat-inc',
    });

    expect(entry.source).toBe('manual');
    expect(entry.status).toBe('pending');
    expect(entry.valueCents).toBe(15000);
    expect(entry.incomeCategoryId).toBe('cat-inc');
    expect(entry.recurrenceGroupId).toBeNull();
  });

  it('creates recurring monthly entries with shared group id', async () => {
    const entries = await useCase.execute({
      storeId,
      type: 'expense',
      description: 'Aluguel',
      valueCents: 200000,
      dueDate: '2026-01-10',
      categoryId: 'cat-exp',
      isRecurring: true,
      recurrenceType: 'monthly',
      recurrenceTimes: 3,
    });

    expect(entries).toHaveLength(3);
    const groupId = entries[0].recurrenceGroupId;
    expect(groupId).toBeTruthy();
    expect(entries.every((e) => e.recurrenceGroupId === groupId)).toBe(true);
    expect(entries.map((e) => e.installmentNumber)).toEqual([1, 2, 3]);
    expect(entries[0].totalInstallments).toBe(3);
    expect(toIsoDateOnly(entries[0].dueDate)).toBe('2026-01-10');
    expect(toIsoDateOnly(entries[1].dueDate)).toBe('2026-02-10');
    expect(toIsoDateOnly(entries[2].dueDate)).toBe('2026-03-10');
  });

  it('marks expense as paid when isPaid is true', async () => {
    const [entry] = await useCase.execute({
      storeId,
      type: 'expense',
      description: 'Material',
      valueCents: 5000,
      dueDate: '2026-07-01',
      isPaid: true,
      paymentMethod: 'pix',
      accountId: 'acc-1',
      paidValueCents: 5000,
      paymentDate: '2026-07-01',
    });

    expect(entry.status).toBe('paid');
    expect(entry.paidValueCents).toBe(5000);
    expect(entry.paymentMethod).toBe('pix');
    expect(entry.accountId).toBe('acc-1');
  });
});
