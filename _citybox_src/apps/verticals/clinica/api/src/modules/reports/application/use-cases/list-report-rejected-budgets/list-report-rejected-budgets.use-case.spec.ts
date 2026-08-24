import { ListReportRejectedBudgetsUseCase } from './list-report-rejected-budgets.use-case';
import { InMemoryReportRejectedBudgetsRepository } from '../../../tests/in-memory-report-rejected-budgets.repository';

const STORE_A = '11111111-1111-4111-8111-111111111111';
const STORE_B = '22222222-2222-4222-8222-222222222222';

describe('ListReportRejectedBudgetsUseCase', () => {
  function createHarness() {
    const repo = new InMemoryReportRejectedBudgetsRepository();
    const useCase = new ListReportRejectedBudgetsUseCase(repo);
    return { repo, useCase };
  }

  it('lists rejected budgets whose rejectedAt is in range', async () => {
    const { repo, useCase } = createHarness();
    repo.seed([
      {
        id: 'b1',
        storeId: STORE_A,
        status: 'rejected',
        rejectedAt: '2026-07-21',
        date: '2026-07-10',
        description: 'Reprovado',
        finalValueCents: 50000,
        patientName: 'Ana',
        document: '52998224725',
        mobile: '73999887766',
        email: 'ana@email.com',
        responsibleMobile: '73991112233',
      },
      {
        id: 'b2',
        storeId: STORE_A,
        status: 'rejected',
        rejectedAt: '2026-06-15',
        date: '2026-06-10',
        description: 'Fora do mês',
        finalValueCents: 10000,
        patientName: 'Bruno',
        document: '1',
        mobile: '1',
        email: '',
        responsibleMobile: '',
      },
    ]);

    const result = await useCase.execute({
      storeId: STORE_A,
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    });

    expect(result.total).toBe(1);
    expect(result.items[0]?.id).toBe('b1');
    expect(result.items[0]?.status).toBe('rejected');
    expect(result.items[0]?.budgetDate).toBe('2026-07-10');
  });

  it('includes rejected budgets with null rejectedAt when date is in range', async () => {
    const { repo, useCase } = createHarness();
    repo.seed([
      {
        id: 'b-legacy',
        storeId: STORE_A,
        status: 'rejected',
        rejectedAt: null,
        date: '2026-07-21',
        description: 'Legado sem rejectedAt',
        finalValueCents: 9000,
        patientName: 'Leo',
        document: '',
        mobile: '',
        email: '',
        responsibleMobile: '',
      },
      {
        id: 'b-out',
        storeId: STORE_A,
        status: 'rejected',
        rejectedAt: null,
        date: '2026-06-01',
        description: 'Fora',
        finalValueCents: 1000,
        patientName: 'Out',
        document: '',
        mobile: '',
        email: '',
        responsibleMobile: '',
      },
    ]);

    const result = await useCase.execute({
      storeId: STORE_A,
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    });

    expect(result.total).toBe(1);
    expect(result.items[0]?.id).toBe('b-legacy');
  });

  it('excludes pending and approved budgets', async () => {
    const { repo, useCase } = createHarness();
    repo.seed([
      {
        id: 'b-pending',
        storeId: STORE_A,
        status: 'pending',
        rejectedAt: null,
        date: '2026-07-10',
        description: 'Pendente',
        finalValueCents: 1000,
        patientName: 'P',
        document: '',
        mobile: '',
        email: '',
        responsibleMobile: '',
      },
      {
        id: 'b-approved',
        storeId: STORE_A,
        status: 'approved',
        rejectedAt: null,
        date: '2026-07-15',
        description: 'Aprovado',
        finalValueCents: 2000,
        patientName: 'A',
        document: '',
        mobile: '',
        email: '',
        responsibleMobile: '',
      },
    ]);

    const result = await useCase.execute({
      storeId: STORE_A,
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    });

    expect(result.total).toBe(0);
  });

  it('scopes by storeId and paginates', async () => {
    const { repo, useCase } = createHarness();
    repo.seed([
      {
        id: 'b-a1',
        storeId: STORE_A,
        status: 'rejected',
        rejectedAt: '2026-07-10',
        date: '2026-07-08',
        description: 'A',
        finalValueCents: 1,
        patientName: 'Alice',
        document: '',
        mobile: '',
        email: '',
        responsibleMobile: '',
      },
      {
        id: 'b-a2',
        storeId: STORE_A,
        status: 'rejected',
        rejectedAt: '2026-07-18',
        date: '2026-07-16',
        description: 'C',
        finalValueCents: 2,
        patientName: 'Carla',
        document: '',
        mobile: '',
        email: '',
        responsibleMobile: '',
      },
      {
        id: 'b-b',
        storeId: STORE_B,
        status: 'rejected',
        rejectedAt: '2026-07-15',
        date: '2026-07-14',
        description: 'B',
        finalValueCents: 3,
        patientName: 'Bruno',
        document: '',
        mobile: '',
        email: '',
        responsibleMobile: '',
      },
    ]);

    const page1 = await useCase.execute({
      storeId: STORE_A,
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      page: 1,
      perPage: 1,
    });

    expect(page1.total).toBe(2);
    expect(page1.totalPages).toBe(2);
    expect(page1.items).toHaveLength(1);
    expect(page1.items[0]?.budgetDate).toBe('2026-07-16');
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
