import { InMemoryExpenseRepository } from '../../../infrastructure/database/in-memory-expense.repository';
import { ListExpensesUseCase } from './list-expenses.use-case';

const STORE = 'store-1';

describe('ListExpensesUseCase', () => {
  let repo: InMemoryExpenseRepository;
  let useCase: ListExpensesUseCase;

  beforeEach(() => {
    repo = new InMemoryExpenseRepository();
    useCase = new ListExpensesUseCase(repo);
  });

  it('returns the store expenses sorted by most recent date', async () => {
    await repo.create({
      storeId: STORE,
      label: 'Aluguel',
      amountCents: 500_000,
      date: '2026-07-01',
      category: 'fixo',
    });
    await repo.create({
      storeId: STORE,
      label: 'Anúncios',
      amountCents: 120_000,
      date: '2026-07-20',
      category: 'marketing',
    });

    const expenses = await useCase.execute({ storeId: STORE });

    expect(expenses.map((e) => e.label)).toEqual(['Anúncios', 'Aluguel']);
  });

  it('isolates by store', async () => {
    await repo.create({
      storeId: 'other-store',
      label: 'Aluguel',
      amountCents: 500_000,
      date: '2026-07-01',
      category: 'fixo',
    });

    await expect(useCase.execute({ storeId: STORE })).resolves.toEqual([]);
  });
});
