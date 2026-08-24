import { ExpenseNotFoundError } from '../../../domain/errors/expense-not-found.error';
import { InMemoryExpenseRepository } from '../../../infrastructure/database/in-memory-expense.repository';
import { DeleteExpenseUseCase } from './delete-expense.use-case';

const STORE = 'store-1';

describe('DeleteExpenseUseCase', () => {
  let repo: InMemoryExpenseRepository;
  let useCase: DeleteExpenseUseCase;

  beforeEach(() => {
    repo = new InMemoryExpenseRepository();
    useCase = new DeleteExpenseUseCase(repo);
  });

  it('removes the expense', async () => {
    const expense = await repo.create({
      storeId: STORE,
      label: 'Aluguel',
      amountCents: 500_000,
      date: '2026-07-01',
      category: 'fixo',
    });

    await useCase.execute({ storeId: STORE, id: expense.id });

    await expect(repo.findMany(STORE)).resolves.toHaveLength(0);
  });

  it('throws when the expense belongs to another store', async () => {
    const expense = await repo.create({
      storeId: 'other-store',
      label: 'Aluguel',
      amountCents: 500_000,
      date: '2026-07-01',
      category: 'fixo',
    });

    await expect(
      useCase.execute({ storeId: STORE, id: expense.id }),
    ).rejects.toBeInstanceOf(ExpenseNotFoundError);
  });
});
