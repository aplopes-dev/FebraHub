import { BadRequestException } from '@nestjs/common';
import { FinancialEntry } from '../../../../financial/entries/domain/entities/financial-entry.entity';
import { InMemoryFinancialEntryRepository } from '../../../../financial/entries/tests/in-memory-financial-entry.repository';
import { GetDashboardInadimplenciaUseCase } from './get-dashboard-inadimplencia.use-case';

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
  p3: 'pppppppp-pppp-4ppp-8ppp-ppppppppppp3',
} as const;

describe('GetDashboardInadimplenciaUseCase', () => {
  function createUseCase() {
    const repo = new InMemoryFinancialEntryRepository();
    repo.seedPatientName(IDS.p1, 'Ana');
    repo.seedPatientName(IDS.p2, 'Bruno');
    repo.seedPatientName(IDS.p3, 'Carla');
    repo.seedPatientPhone(IDS.p1, '73999887766');
    return {
      repo,
      useCase: new GetDashboardInadimplenciaUseCase(repo),
    };
  }

  function entry(input: {
    id: string;
    storeId?: string;
    status: 'pending' | 'received' | 'cancelled';
    dueDate: Date;
    valueCents: number;
    patientId?: string | null;
  }): FinancialEntry {
    return FinancialEntry.create(
      {
        storeId: input.storeId ?? storeId,
        type: 'income',
        status: input.status,
        source: 'manual',
        description: 'Débito teste',
        valueCents: input.valueCents,
        dueDate: input.dueDate,
        paidAt: input.status === 'received' ? input.dueDate : null,
        paidValueCents: input.status === 'received' ? input.valueCents : null,
        patientId: input.patientId === undefined ? IDS.p1 : input.patientId,
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

  it('aggregates only currently delinquent patients debts in period', async () => {
    const { repo, useCase } = createUseCase();
    repo.seed([
      // p1 delinquent (overdue pending)
      entry({
        id: IDS.e1,
        status: 'pending',
        dueDate: new Date('2026-07-05T00:00:00.000Z'),
        valueCents: 10000,
        patientId: IDS.p1,
      }),
      // p1 received in period → contributes to adimplência
      entry({
        id: IDS.e2,
        status: 'received',
        dueDate: new Date('2026-07-10T00:00:00.000Z'),
        valueCents: 5000,
        patientId: IDS.p1,
      }),
      // p2 has only future pending → NOT currently delinquent
      entry({
        id: IDS.e3,
        status: 'pending',
        dueDate: new Date('2026-07-25T00:00:00.000Z'),
        valueCents: 99999,
        patientId: IDS.p2,
      }),
      // p3 delinquent but debt outside July
      entry({
        id: IDS.e4,
        status: 'pending',
        dueDate: new Date('2026-06-01T00:00:00.000Z'),
        valueCents: 2000,
        patientId: IDS.p3,
      }),
      // cancelled excluded
      entry({
        id: IDS.e5,
        status: 'cancelled',
        dueDate: new Date('2026-07-08T00:00:00.000Z'),
        valueCents: 1000,
        patientId: IDS.p1,
      }),
      // no patient excluded
      entry({
        id: IDS.e6,
        status: 'pending',
        dueDate: new Date('2026-07-01T00:00:00.000Z'),
        valueCents: 3000,
        patientId: null,
      }),
      // other store
      entry({
        id: IDS.e7,
        storeId: otherStoreId,
        status: 'pending',
        dueDate: new Date('2026-07-02T00:00:00.000Z'),
        valueCents: 8000,
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

    // only e1 (10000 unpaid) + e2 (5000 received) from p1
    expect(result.totalDebtsCents).toBe(15000);
    expect(result.unpaidCents).toBe(10000);
    expect(result.receivedCents).toBe(5000);
    expect(result.ratePercent).toBe(66.7);
  });

  it('returns years descending from income dueDates with patient', async () => {
    const { repo, useCase } = createUseCase();
    repo.seed([
      entry({
        id: IDS.e1,
        status: 'pending',
        dueDate: new Date('2026-01-01T00:00:00.000Z'),
        valueCents: 100,
        patientId: IDS.p1,
      }),
      entry({
        id: IDS.e2,
        status: 'received',
        dueDate: new Date('2024-06-01T00:00:00.000Z'),
        valueCents: 100,
        patientId: IDS.p1,
      }),
      entry({
        id: IDS.e3,
        status: 'received',
        dueDate: new Date('2025-03-01T00:00:00.000Z'),
        valueCents: 100,
        patientId: IDS.p2,
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
});
