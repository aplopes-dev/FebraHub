import { BadRequestException } from '@nestjs/common';
import { FinancialEntry } from '../../../../financial/entries/domain/entities/financial-entry.entity';
import { InMemoryFinancialEntryRepository } from '../../../../financial/entries/tests/in-memory-financial-entry.repository';
import { GetDashboardCashflowUseCase } from './get-dashboard-cashflow.use-case';

const storeId = '11111111-1111-1111-1111-111111111111';
const otherStoreId = '22222222-2222-2222-2222-222222222222';
const TODAY = new Date('2026-07-20T12:00:00.000Z');
const IDS = {
  e1: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',
  e2: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2',
  e3: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee3',
  e4: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee4',
  e5: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee5',
  e6: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee6',
} as const;

describe('GetDashboardCashflowUseCase', () => {
  function createUseCase() {
    const repo = new InMemoryFinancialEntryRepository();
    return {
      repo,
      useCase: new GetDashboardCashflowUseCase(repo),
    };
  }

  function seedMany(
    repo: InMemoryFinancialEntryRepository,
    entries: FinancialEntry[],
  ) {
    repo.seed(entries);
  }

  function entry(input: {
    id: string;
    storeId?: string;
    type: 'income' | 'expense';
    status?: 'pending' | 'paid' | 'received' | 'cancelled';
    dueDate: Date;
    paidAt?: Date | null;
    valueCents: number;
    paidValueCents?: number | null;
  }): FinancialEntry {
    const status =
      input.status ??
      (input.paidAt
        ? input.type === 'income'
          ? 'received'
          : 'paid'
        : 'pending');
    return FinancialEntry.create(
      {
        storeId: input.storeId ?? storeId,
        type: input.type,
        status,
        source: 'manual',
        description: 'Lançamento teste',
        valueCents: input.valueCents,
        dueDate: input.dueDate,
        paidAt: input.paidAt ?? null,
        paidValueCents: input.paidValueCents ?? null,
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
        now: TODAY,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('aggregates paid and forecast, excludes overdue and cancelled', async () => {
    const { repo, useCase } = createUseCase();
    seedMany(repo, [
      entry({
        id: IDS.e1,
        type: 'income',
        dueDate: new Date('2026-07-05T00:00:00.000Z'),
        paidAt: new Date('2026-07-05T00:00:00.000Z'),
        valueCents: 10000,
        paidValueCents: 10000,
      }),
      entry({
        id: IDS.e2,
        type: 'expense',
        dueDate: new Date('2026-07-08T00:00:00.000Z'),
        paidAt: new Date('2026-07-08T00:00:00.000Z'),
        valueCents: 3000,
        paidValueCents: 3000,
      }),
      entry({
        id: IDS.e3,
        type: 'income',
        dueDate: new Date('2026-07-25T00:00:00.000Z'),
        paidAt: null,
        valueCents: 5000,
      }),
      entry({
        id: IDS.e4,
        type: 'income',
        dueDate: new Date('2026-07-10T00:00:00.000Z'),
        paidAt: null,
        valueCents: 2000,
      }),
      entry({
        id: IDS.e5,
        type: 'income',
        status: 'cancelled',
        dueDate: new Date('2026-07-12T00:00:00.000Z'),
        paidAt: new Date('2026-07-12T00:00:00.000Z'),
        valueCents: 9999,
      }),
      entry({
        id: IDS.e6,
        type: 'income',
        dueDate: new Date('2026-06-01T00:00:00.000Z'),
        paidAt: new Date('2026-06-01T00:00:00.000Z'),
        valueCents: 8000,
        paidValueCents: 8000,
      }),
    ]);

    const result = await useCase.execute({
      storeId,
      periodMode: 'monthly',
      year: 2026,
      month: 7,
      now: TODAY,
    });

    expect(result.totals).toEqual({
      incomeCents: 15000,
      expenseCents: 3000,
      balanceCents: 12000,
    });
    expect(result.timeline).toHaveLength(31);
    expect(result.timeline[4]).toMatchObject({
      key: '2026-07-05',
      incomePaid: 100,
      expensePaid: 0,
    });
    expect(result.timeline[24]).toMatchObject({
      key: '2026-07-25',
      incomeForecast: 50,
    });
  });

  it('filters annual period and isolates store', async () => {
    const { repo, useCase } = createUseCase();
    seedMany(repo, [
      entry({
        id: IDS.e1,
        type: 'income',
        dueDate: new Date('2026-03-15T00:00:00.000Z'),
        paidAt: new Date('2026-03-15T00:00:00.000Z'),
        valueCents: 1000,
        paidValueCents: 1000,
      }),
      entry({
        id: IDS.e2,
        type: 'income',
        dueDate: new Date('2025-12-31T00:00:00.000Z'),
        paidAt: new Date('2025-12-31T00:00:00.000Z'),
        valueCents: 2000,
        paidValueCents: 2000,
      }),
      entry({
        id: IDS.e3,
        storeId: otherStoreId,
        type: 'income',
        dueDate: new Date('2026-03-01T00:00:00.000Z'),
        paidAt: new Date('2026-03-01T00:00:00.000Z'),
        valueCents: 5000,
        paidValueCents: 5000,
      }),
    ]);

    const result = await useCase.execute({
      storeId,
      periodMode: 'annual',
      year: 2026,
      now: TODAY,
    });

    expect(result.totals.incomeCents).toBe(1000);
    expect(result.timeline).toHaveLength(12);
    expect(result.timeline[2]).toMatchObject({
      key: '2026-03',
      label: 'Mar',
      incomePaid: 10,
    });
  });

  it('returns distinct cashflow years descending', async () => {
    const { repo, useCase } = createUseCase();
    seedMany(repo, [
      entry({
        id: IDS.e1,
        type: 'income',
        dueDate: new Date('2026-07-01T00:00:00.000Z'),
        paidAt: new Date('2026-07-01T00:00:00.000Z'),
        valueCents: 100,
        paidValueCents: 100,
      }),
      entry({
        id: IDS.e2,
        type: 'expense',
        dueDate: new Date('2024-01-01T00:00:00.000Z'),
        paidAt: null,
        valueCents: 100,
      }),
      entry({
        id: IDS.e3,
        type: 'income',
        dueDate: new Date('2025-06-01T00:00:00.000Z'),
        paidAt: new Date('2025-06-02T00:00:00.000Z'),
        valueCents: 100,
        paidValueCents: 100,
      }),
      entry({
        id: IDS.e4,
        type: 'income',
        status: 'cancelled',
        dueDate: new Date('2023-01-01T00:00:00.000Z'),
        paidAt: null,
        valueCents: 100,
      }),
    ]);

    const result = await useCase.execute({
      storeId,
      periodMode: 'annual',
      year: 2026,
      now: TODAY,
    });

    expect(result.years).toEqual([2026, 2025, 2024]);
  });

  it('uses paidValueCents for paid bucket when present', async () => {
    const { repo, useCase } = createUseCase();
    seedMany(repo, [
      entry({
        id: IDS.e1,
        type: 'income',
        dueDate: new Date('2026-07-05T00:00:00.000Z'),
        paidAt: new Date('2026-07-05T00:00:00.000Z'),
        valueCents: 10000,
        paidValueCents: 7500,
      }),
    ]);

    const result = await useCase.execute({
      storeId,
      periodMode: 'monthly',
      year: 2026,
      month: 7,
      now: TODAY,
    });

    expect(result.totals.incomeCents).toBe(7500);
    expect(result.timeline[4]?.incomePaid).toBe(75);
  });
});
