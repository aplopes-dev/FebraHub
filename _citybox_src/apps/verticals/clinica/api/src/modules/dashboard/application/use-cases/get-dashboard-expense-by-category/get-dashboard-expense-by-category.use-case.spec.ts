import { BadRequestException } from '@nestjs/common';
import { FinancialEntry } from '../../../../financial/entries/domain/entities/financial-entry.entity';
import { InMemoryFinancialEntryRepository } from '../../../../financial/entries/tests/in-memory-financial-entry.repository';
import { GetDashboardExpenseByCategoryUseCase } from './get-dashboard-expense-by-category.use-case';

const storeId = '11111111-1111-1111-1111-111111111111';
const otherStoreId = '22222222-2222-2222-2222-222222222222';
const IDS = {
  e1: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',
  e2: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2',
  e3: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee3',
  e4: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee4',
  e5: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee5',
  e6: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee6',
  cLabs: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
  cFixed: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc2',
} as const;

describe('GetDashboardExpenseByCategoryUseCase', () => {
  function createUseCase() {
    const repo = new InMemoryFinancialEntryRepository();
    repo.seedExpenseCategory(IDS.cLabs, 'Laboratórios', '#16a34a');
    repo.seedExpenseCategory(IDS.cFixed, 'Custos Fixos', '#2563eb');
    return {
      repo,
      useCase: new GetDashboardExpenseByCategoryUseCase(repo),
    };
  }

  function expense(input: {
    id: string;
    storeId?: string;
    status?: 'pending' | 'paid' | 'cancelled';
    paidAt: Date | null;
    valueCents: number;
    paidValueCents?: number | null;
    expenseCategoryId?: string | null;
  }): FinancialEntry {
    return FinancialEntry.create(
      {
        storeId: input.storeId ?? storeId,
        type: 'expense',
        status: input.status ?? 'paid',
        source: 'manual',
        description: 'Despesa teste',
        valueCents: input.valueCents,
        dueDate: input.paidAt ?? new Date('2026-07-01T00:00:00.000Z'),
        paidAt: input.paidAt,
        paidValueCents: input.paidValueCents ?? null,
        expenseCategoryId: input.expenseCategoryId ?? null,
      },
      input.id,
    );
  }

  it('requires month when periodMode is monthly', async () => {
    const { useCase } = createUseCase();
    await expect(
      useCase.execute({
        storeId,
        periodMode: 'monthly',
        year: 2026,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('aggregates paid expenses by category with percent and isolates store', async () => {
    const { repo, useCase } = createUseCase();
    repo.seed([
      expense({
        id: IDS.e1,
        paidAt: new Date('2026-07-05T00:00:00.000Z'),
        valueCents: 10000,
        paidValueCents: 10000,
        expenseCategoryId: IDS.cLabs,
      }),
      expense({
        id: IDS.e2,
        paidAt: new Date('2026-07-10T00:00:00.000Z'),
        valueCents: 5000,
        paidValueCents: 4000,
        expenseCategoryId: IDS.cLabs,
      }),
      expense({
        id: IDS.e3,
        paidAt: new Date('2026-07-12T00:00:00.000Z'),
        valueCents: 6000,
        paidValueCents: 6000,
        expenseCategoryId: IDS.cFixed,
      }),
      // uncategorized
      expense({
        id: IDS.e4,
        paidAt: new Date('2026-07-15T00:00:00.000Z'),
        valueCents: 2000,
        paidValueCents: 2000,
        expenseCategoryId: null,
      }),
      // pending excluded
      expense({
        id: IDS.e5,
        status: 'pending',
        paidAt: null,
        valueCents: 99999,
        expenseCategoryId: IDS.cLabs,
      }),
      // other store
      expense({
        id: IDS.e6,
        storeId: otherStoreId,
        paidAt: new Date('2026-07-08T00:00:00.000Z'),
        valueCents: 50000,
        paidValueCents: 50000,
        expenseCategoryId: IDS.cLabs,
      }),
    ]);

    const result = await useCase.execute({
      storeId,
      periodMode: 'monthly',
      year: 2026,
      month: 7,
    });

    expect(result.totalCents).toBe(22000); // 10000+4000+6000+2000
    expect(result.items).toHaveLength(3);
    expect(result.items[0]).toMatchObject({
      categoryId: IDS.cLabs,
      label: 'Laboratórios',
      color: '#16a34a',
      amountCents: 14000,
    });
    expect(result.items[1]).toMatchObject({
      categoryId: IDS.cFixed,
      amountCents: 6000,
    });
    expect(result.items[2]).toMatchObject({
      categoryId: 'uncategorized',
      label: 'Sem categoria',
      amountCents: 2000,
    });
    const percentSum = result.items.reduce(
      (acc, item) => acc + item.percent,
      0,
    );
    expect(percentSum).toBeCloseTo(100, 5);
  });

  it('returns years descending from paidAt of paid expenses', async () => {
    const { repo, useCase } = createUseCase();
    repo.seed([
      expense({
        id: IDS.e1,
        paidAt: new Date('2026-01-01T00:00:00.000Z'),
        valueCents: 100,
        paidValueCents: 100,
        expenseCategoryId: IDS.cLabs,
      }),
      expense({
        id: IDS.e2,
        paidAt: new Date('2024-06-01T00:00:00.000Z'),
        valueCents: 100,
        paidValueCents: 100,
        expenseCategoryId: IDS.cFixed,
      }),
      expense({
        id: IDS.e3,
        paidAt: new Date('2025-03-01T00:00:00.000Z'),
        valueCents: 100,
        paidValueCents: 100,
        expenseCategoryId: IDS.cLabs,
      }),
    ]);

    const result = await useCase.execute({
      storeId,
      periodMode: 'annual',
      year: 2026,
    });

    expect(result.years).toEqual([2026, 2025, 2024]);
  });
});
