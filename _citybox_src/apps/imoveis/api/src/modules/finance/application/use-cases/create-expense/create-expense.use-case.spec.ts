import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { InMemoryExpenseRepository } from '../../../infrastructure/database/in-memory-expense.repository';
import { CreateExpenseUseCase } from './create-expense.use-case';

const STORE = 'store-1';

describe('CreateExpenseUseCase', () => {
  let repo: InMemoryExpenseRepository;
  let useCase: CreateExpenseUseCase;

  beforeEach(() => {
    repo = new InMemoryExpenseRepository();
    useCase = new CreateExpenseUseCase(repo);
  });

  it('creates an expense and trims the label', async () => {
    const expense = await useCase.execute({
      storeId: STORE,
      label: '  Anúncios  ',
      amountCents: 120_000,
      date: '2026-07-20',
      category: 'marketing',
    });

    expect(expense.label).toBe('Anúncios');
    expect(expense.amountCents).toBe(120_000);
    await expect(repo.findMany(STORE)).resolves.toHaveLength(1);
  });

  it('defaults the category to an empty string', async () => {
    const expense = await useCase.execute({
      storeId: STORE,
      label: 'Cartório',
      amountCents: 30_000,
      date: '2026-07-20',
    });

    expect(expense.category).toBe('');
  });

  it('rejects an empty label', async () => {
    await expect(
      useCase.execute({
        storeId: STORE,
        label: '   ',
        amountCents: 100,
        date: '2026-07-20',
      }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });

  it('rejects a negative amount', async () => {
    await expect(
      useCase.execute({
        storeId: STORE,
        label: 'Erro',
        amountCents: -1,
        date: '2026-07-20',
      }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });

  it('rejects a malformed date', async () => {
    await expect(
      useCase.execute({
        storeId: STORE,
        label: 'Erro',
        amountCents: 100,
        date: '20/07/2026',
      }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });
});
