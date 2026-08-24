import { FinancialEntry } from '../../../../financial/entries/domain/entities/financial-entry.entity';
import { InMemoryFinancialEntryRepository } from '../../../../financial/entries/tests/in-memory-financial-entry.repository';
import { ListDashboardInadimplenciaDetailsUseCase } from './list-dashboard-inadimplencia-details.use-case';

const storeId = '11111111-1111-1111-1111-111111111111';
const TODAY = new Date('2026-07-20T12:00:00.000Z');
const IDS = {
  e1: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',
  e2: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2',
  e3: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee3',
  e4: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee4',
  p1: 'pppppppp-pppp-4ppp-8ppp-ppppppppppp1',
  p2: 'pppppppp-pppp-4ppp-8ppp-ppppppppppp2',
} as const;

describe('ListDashboardInadimplenciaDetailsUseCase', () => {
  function createUseCase() {
    const repo = new InMemoryFinancialEntryRepository();
    repo.seedPatientName(IDS.p1, 'Ana');
    repo.seedPatientName(IDS.p2, 'Bruno');
    repo.seedPatientPhone(IDS.p1, '73999887766');
    return {
      repo,
      useCase: new ListDashboardInadimplenciaDetailsUseCase(repo),
    };
  }

  function entry(input: {
    id: string;
    status: 'pending' | 'received';
    dueDate: Date;
    valueCents: number;
    patientId: string;
    description?: string;
  }): FinancialEntry {
    return FinancialEntry.create(
      {
        storeId,
        type: 'income',
        status: input.status,
        source: 'manual',
        description: input.description ?? 'Débito teste',
        valueCents: input.valueCents,
        dueDate: input.dueDate,
        paidAt: input.status === 'received' ? input.dueDate : null,
        paidValueCents: input.status === 'received' ? input.valueCents : null,
        patientId: input.patientId,
      },
      input.id,
    );
  }

  it('lists unpaid debts sorted by dueDate with daysOverdue and pagination', async () => {
    const { repo, useCase } = createUseCase();
    repo.seed([
      entry({
        id: IDS.e1,
        status: 'pending',
        dueDate: new Date('2026-07-15T00:00:00.000Z'),
        valueCents: 8000,
        patientId: IDS.p1,
        description: 'Parcela 2',
      }),
      entry({
        id: IDS.e2,
        status: 'pending',
        dueDate: new Date('2026-07-05T00:00:00.000Z'),
        valueCents: 10000,
        patientId: IDS.p1,
        description: 'Parcela 1',
      }),
      // received → excluded from unpaid list
      entry({
        id: IDS.e3,
        status: 'received',
        dueDate: new Date('2026-07-08T00:00:00.000Z'),
        valueCents: 5000,
        patientId: IDS.p1,
      }),
      // p2 not delinquent
      entry({
        id: IDS.e4,
        status: 'pending',
        dueDate: new Date('2026-07-25T00:00:00.000Z'),
        valueCents: 3000,
        patientId: IDS.p2,
      }),
    ]);

    const page1 = await useCase.execute({
      storeId,
      periodMode: 'monthly',
      year: 2026,
      month: 7,
      page: 1,
      perPage: 1,
      now: TODAY,
    });

    expect(page1.total).toBe(2);
    expect(page1.totalPages).toBe(2);
    expect(page1.items).toHaveLength(1);
    expect(page1.items[0]).toMatchObject({
      id: IDS.e2,
      dueDate: '2026-07-05',
      daysOverdue: 15,
      patientId: IDS.p1,
      patientName: 'Ana',
      phone: '73999887766',
      unpaidCents: 10000,
      description: 'Parcela 1',
    });

    const page2 = await useCase.execute({
      storeId,
      periodMode: 'monthly',
      year: 2026,
      month: 7,
      page: 2,
      perPage: 1,
      now: TODAY,
    });

    expect(page2.items[0]).toMatchObject({
      id: IDS.e1,
      dueDate: '2026-07-15',
      daysOverdue: 5,
      unpaidCents: 8000,
    });
  });
});
