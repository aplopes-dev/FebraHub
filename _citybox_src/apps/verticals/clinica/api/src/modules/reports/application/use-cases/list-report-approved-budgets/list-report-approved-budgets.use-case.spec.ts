import { ListReportApprovedBudgetsUseCase } from './list-report-approved-budgets.use-case';
import { InMemoryReportApprovedBudgetsRepository } from '../../../tests/in-memory-report-approved-budgets.repository';

const STORE_A = '11111111-1111-4111-8111-111111111111';
const STORE_B = '22222222-2222-4222-8222-222222222222';

describe('ListReportApprovedBudgetsUseCase', () => {
  function createHarness() {
    const repo = new InMemoryReportApprovedBudgetsRepository();
    const useCase = new ListReportApprovedBudgetsUseCase(repo);
    return { repo, useCase };
  }

  it('lists approved budgets whose approvedAt is in range', async () => {
    const { repo, useCase } = createHarness();
    repo.seed([
      {
        id: 'b1',
        storeId: STORE_A,
        status: 'approved',
        approvedAt: new Date('2026-07-15T12:00:00.000Z'),
        date: '2026-07-10',
        description: 'Clareamento',
        finalValueCents: 89000,
        patientName: 'Ana',
        document: '52998224725',
        mobile: '73999887766',
        email: 'ana@email.com',
        responsibleMobile: '73991112233',
      },
      {
        id: 'b2',
        storeId: STORE_A,
        status: 'approved',
        approvedAt: new Date('2026-06-20T12:00:00.000Z'),
        date: '2026-06-18',
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
    expect(result.items[0]?.budgetDate).toBe('2026-07-10');
    expect(result.items[0]?.status).toBe('approved');
    expect(result.items[0]?.valueCents).toBe(89000);
    expect(result.items[0]?.responsibleMobile).toBe('73991112233');
  });

  it('excludes pending and rejected budgets', async () => {
    const { repo, useCase } = createHarness();
    repo.seed([
      {
        id: 'b-pending',
        storeId: STORE_A,
        status: 'pending',
        approvedAt: null,
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
        id: 'b-rejected',
        storeId: STORE_A,
        status: 'rejected',
        approvedAt: new Date('2026-07-15T12:00:00.000Z'),
        date: '2026-07-10',
        description: 'Reprovado',
        finalValueCents: 2000,
        patientName: 'R',
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

  it('scopes by storeId and paginates ordered by date DESC', async () => {
    const { repo, useCase } = createHarness();
    repo.seed([
      {
        id: 'b-a1',
        storeId: STORE_A,
        status: 'approved',
        approvedAt: new Date('2026-07-10T12:00:00.000Z'),
        date: '2026-07-10',
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
        status: 'approved',
        approvedAt: new Date('2026-07-18T12:00:00.000Z'),
        date: '2026-07-18',
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
        status: 'approved',
        approvedAt: new Date('2026-07-15T12:00:00.000Z'),
        date: '2026-07-15',
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
    expect(page1.items[0]?.budgetDate).toBe('2026-07-18');
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
