import { ListReportExpensesByCategoryUseCase } from './list-report-expenses-by-category.use-case';
import { InMemoryReportExpensesByCategoryRepository } from '../../../tests/in-memory-report-expenses-by-category.repository';

const STORE_A = '11111111-1111-4111-8111-111111111111';
const STORE_B = '22222222-2222-4222-8222-222222222222';

describe('ListReportExpensesByCategoryUseCase', () => {
  function createHarness() {
    const repo = new InMemoryReportExpensesByCategoryRepository();
    const useCase = new ListReportExpensesByCategoryUseCase(repo);
    return { repo, useCase };
  }

  it('aggregates paid expenses by category in range', async () => {
    const { repo, useCase } = createHarness();
    repo.seed([
      {
        storeId: STORE_A,
        type: 'expense',
        status: 'paid',
        paidAt: '2026-07-10',
        expenseCategoryId: 'cat-labs',
        expenseCategoryName: 'Laboratórios',
        amountCents: 1_000_000,
      },
      {
        storeId: STORE_A,
        type: 'expense',
        status: 'paid',
        paidAt: '2026-07-15',
        expenseCategoryId: 'cat-labs',
        expenseCategoryName: 'Laboratórios',
        amountCents: 450_000,
      },
      {
        storeId: STORE_A,
        type: 'expense',
        status: 'paid',
        paidAt: '2026-07-20',
        expenseCategoryId: 'cat-fixed',
        expenseCategoryName: 'Custos Fixos',
        amountCents: 550_000,
      },
    ]);

    const result = await useCase.execute({
      storeId: STORE_A,
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    });

    expect(result.total).toBe(2);
    expect(result.items[0]?.id).toBe('cat-labs');
    expect(result.items[0]?.valueCents).toBe(1_450_000);
    expect(result.items[0]?.percentage).toBe(72.5);
    expect(result.items[1]?.id).toBe('cat-fixed');
    expect(result.items[1]?.valueCents).toBe(550_000);
    expect(result.items[1]?.percentage).toBe(27.5);
  });

  it('maps null category to Sem categoria and excludes pending', async () => {
    const { repo, useCase } = createHarness();
    repo.seed([
      {
        storeId: STORE_A,
        type: 'expense',
        status: 'paid',
        paidAt: '2026-07-12',
        expenseCategoryId: null,
        expenseCategoryName: null,
        amountCents: 100_000,
      },
      {
        storeId: STORE_A,
        type: 'expense',
        status: 'pending',
        paidAt: '2026-07-12',
        expenseCategoryId: 'cat-x',
        expenseCategoryName: 'X',
        amountCents: 999_000,
      },
      {
        storeId: STORE_A,
        type: 'income',
        status: 'received',
        paidAt: '2026-07-12',
        expenseCategoryId: null,
        expenseCategoryName: null,
        amountCents: 50_000,
      },
    ]);

    const result = await useCase.execute({
      storeId: STORE_A,
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    });

    expect(result.total).toBe(1);
    expect(result.items[0]?.id).toBe('uncategorized');
    expect(result.items[0]?.categoryName).toBe('Sem categoria');
    expect(result.items[0]?.percentage).toBe(100);
  });

  it('scopes by storeId and paginates after aggregation', async () => {
    const { repo, useCase } = createHarness();
    repo.seed([
      {
        storeId: STORE_A,
        type: 'expense',
        status: 'paid',
        paidAt: '2026-07-10',
        expenseCategoryId: 'a',
        expenseCategoryName: 'A',
        amountCents: 300,
      },
      {
        storeId: STORE_A,
        type: 'expense',
        status: 'paid',
        paidAt: '2026-07-11',
        expenseCategoryId: 'b',
        expenseCategoryName: 'B',
        amountCents: 200,
      },
      {
        storeId: STORE_A,
        type: 'expense',
        status: 'paid',
        paidAt: '2026-07-12',
        expenseCategoryId: 'c',
        expenseCategoryName: 'C',
        amountCents: 100,
      },
      {
        storeId: STORE_B,
        type: 'expense',
        status: 'paid',
        paidAt: '2026-07-12',
        expenseCategoryId: 'other',
        expenseCategoryName: 'Other',
        amountCents: 9_999,
      },
    ]);

    const page1 = await useCase.execute({
      storeId: STORE_A,
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      page: 1,
      perPage: 2,
    });

    expect(page1.total).toBe(3);
    expect(page1.totalPages).toBe(2);
    expect(page1.items).toHaveLength(2);
    expect(page1.items.map((item) => item.id)).toEqual(['a', 'b']);
  });

  it('excludes expenses outside paidAt range', async () => {
    const { repo, useCase } = createHarness();
    repo.seed([
      {
        storeId: STORE_A,
        type: 'expense',
        status: 'paid',
        paidAt: '2026-06-30',
        expenseCategoryId: 'old',
        expenseCategoryName: 'Old',
        amountCents: 100,
      },
      {
        storeId: STORE_A,
        type: 'expense',
        status: 'paid',
        paidAt: '2026-07-01',
        expenseCategoryId: 'in',
        expenseCategoryName: 'In',
        amountCents: 50,
      },
    ]);

    const result = await useCase.execute({
      storeId: STORE_A,
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    });

    expect(result.total).toBe(1);
    expect(result.items[0]?.id).toBe('in');
  });

  it('rejects inverted civil date range', async () => {
    const { useCase } = createHarness();

    await expect(
      useCase.execute({
        storeId: STORE_A,
        startDate: '2026-07-31',
        endDate: '2026-07-01',
      }),
    ).rejects.toThrow();
  });
});
