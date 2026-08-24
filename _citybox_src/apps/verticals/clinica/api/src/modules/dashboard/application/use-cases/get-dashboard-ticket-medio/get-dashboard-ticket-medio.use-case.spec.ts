import { BadRequestException } from '@nestjs/common';
import { FinancialEntry } from '../../../../financial/entries/domain/entities/financial-entry.entity';
import { InMemoryFinancialEntryRepository } from '../../../../financial/entries/tests/in-memory-financial-entry.repository';
import { GetDashboardTicketMedioUseCase } from './get-dashboard-ticket-medio.use-case';

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
  e7: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee7',
  p1: 'pppppppp-pppp-4ppp-8ppp-ppppppppppp1',
  p2: 'pppppppp-pppp-4ppp-8ppp-ppppppppppp2',
} as const;

describe('GetDashboardTicketMedioUseCase', () => {
  function createUseCase() {
    const repo = new InMemoryFinancialEntryRepository();
    return {
      repo,
      useCase: new GetDashboardTicketMedioUseCase(repo),
    };
  }

  function entry(input: {
    id: string;
    storeId?: string;
    type: 'income' | 'expense';
    status?: 'pending' | 'paid' | 'received' | 'cancelled';
    paidAt: Date | null;
    valueCents: number;
    paidValueCents?: number | null;
    patientId?: string | null;
  }): FinancialEntry {
    const status =
      input.status ?? (input.type === 'income' ? 'received' : 'paid');
    return FinancialEntry.create(
      {
        storeId: input.storeId ?? storeId,
        type: input.type,
        status,
        source: 'manual',
        description: 'Lançamento teste',
        valueCents: input.valueCents,
        dueDate: input.paidAt ?? new Date('2026-07-01T00:00:00.000Z'),
        paidAt: input.paidAt,
        paidValueCents: input.paidValueCents ?? null,
        patientId: input.patientId ?? null,
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

  it('builds monthly rendimento and lucratividade with previous month', async () => {
    const { repo, useCase } = createUseCase();
    repo.seed([
      entry({
        id: IDS.e1,
        type: 'income',
        paidAt: new Date('2026-07-10T00:00:00.000Z'),
        valueCents: 10000,
        paidValueCents: 10000,
        patientId: IDS.p1,
      }),
      entry({
        id: IDS.e2,
        type: 'income',
        paidAt: new Date('2026-07-10T00:00:00.000Z'),
        valueCents: 5000,
        paidValueCents: 5000,
        patientId: IDS.p2,
      }),
      entry({
        id: IDS.e3,
        type: 'expense',
        paidAt: new Date('2026-07-10T00:00:00.000Z'),
        valueCents: 3000,
        paidValueCents: 3000,
      }),
      // previous month same day
      entry({
        id: IDS.e4,
        type: 'income',
        paidAt: new Date('2026-06-10T00:00:00.000Z'),
        valueCents: 8000,
        paidValueCents: 8000,
        patientId: IDS.p1,
      }),
      entry({
        id: IDS.e5,
        type: 'expense',
        paidAt: new Date('2026-06-10T00:00:00.000Z'),
        valueCents: 2000,
        paidValueCents: 2000,
      }),
      // future paidAt excluded
      entry({
        id: IDS.e6,
        type: 'income',
        paidAt: new Date('2026-07-25T00:00:00.000Z'),
        valueCents: 99999,
        paidValueCents: 99999,
        patientId: IDS.p1,
      }),
      // cancelled excluded
      entry({
        id: IDS.e7,
        type: 'income',
        status: 'cancelled',
        paidAt: new Date('2026-07-11T00:00:00.000Z'),
        valueCents: 1000,
        patientId: IDS.p1,
      }),
    ]);

    const result = await useCase.execute({
      storeId,
      periodMode: 'monthly',
      year: 2026,
      month: 7,
      now: TODAY,
    });

    expect(result.rendimento.points).toHaveLength(31);
    const day10 = result.rendimento.points[9];
    expect(day10).toMatchObject({
      key: '2026-07-10',
      label: '10',
      // 15000 / 2 patients
      currentCents: 7500,
      // 8000 / 1 patient
      previousCents: 8000,
    });
    expect(result.lucratividade.points[9]).toMatchObject({
      currentCents: 12000, // 15000 - 3000
      previousCents: 6000, // 8000 - 2000
    });
  });

  it('aggregates annual with distinct patients per month and isolates store', async () => {
    const { repo, useCase } = createUseCase();
    repo.seed([
      entry({
        id: IDS.e1,
        type: 'income',
        paidAt: new Date('2026-03-05T00:00:00.000Z'),
        valueCents: 10000,
        paidValueCents: 10000,
        patientId: IDS.p1,
      }),
      entry({
        id: IDS.e2,
        type: 'income',
        paidAt: new Date('2026-03-20T00:00:00.000Z'),
        valueCents: 10000,
        paidValueCents: 10000,
        patientId: IDS.p1, // same patient → distinct count 1 in March
      }),
      entry({
        id: IDS.e3,
        type: 'expense',
        paidAt: new Date('2026-03-10T00:00:00.000Z'),
        valueCents: 5000,
        paidValueCents: 5000,
      }),
      entry({
        id: IDS.e4,
        type: 'income',
        paidAt: new Date('2025-03-15T00:00:00.000Z'),
        valueCents: 6000,
        paidValueCents: 6000,
        patientId: IDS.p2,
      }),
      entry({
        id: IDS.e5,
        storeId: otherStoreId,
        type: 'income',
        paidAt: new Date('2026-03-01T00:00:00.000Z'),
        valueCents: 50000,
        paidValueCents: 50000,
        patientId: IDS.p2,
      }),
    ]);

    const result = await useCase.execute({
      storeId,
      periodMode: 'annual',
      year: 2026,
      now: TODAY,
    });

    expect(result.rendimento.points).toHaveLength(12);
    expect(result.rendimento.points[2]).toMatchObject({
      key: '2026-03',
      label: 'Mar',
      currentCents: 20000, // 20000 / 1 distinct patient
      previousCents: 6000,
    });
    expect(result.lucratividade.points[2]).toMatchObject({
      currentCents: 15000, // 20000 - 5000
      previousCents: 6000,
    });
  });

  it('uses paidValueCents and returns years descending', async () => {
    const { repo, useCase } = createUseCase();
    repo.seed([
      entry({
        id: IDS.e1,
        type: 'income',
        paidAt: new Date('2026-07-05T00:00:00.000Z'),
        valueCents: 10000,
        paidValueCents: 4000,
        patientId: IDS.p1,
      }),
      entry({
        id: IDS.e2,
        type: 'expense',
        paidAt: new Date('2024-01-01T00:00:00.000Z'),
        valueCents: 100,
        paidValueCents: 100,
      }),
      entry({
        id: IDS.e3,
        type: 'income',
        paidAt: new Date('2025-06-01T00:00:00.000Z'),
        valueCents: 100,
        paidValueCents: 100,
        patientId: IDS.p1,
      }),
    ]);

    const result = await useCase.execute({
      storeId,
      periodMode: 'monthly',
      year: 2026,
      month: 7,
      now: TODAY,
    });

    expect(result.rendimento.points[4]?.currentCents).toBe(4000);
    expect(result.years).toEqual([2026, 2025, 2024]);
  });
});
