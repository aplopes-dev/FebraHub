import { ListReportReferredPatientsUseCase } from './list-report-referred-patients.use-case';
import { InMemoryReportReferredPatientsRepository } from '../../../tests/in-memory-report-referred-patients.repository';

const STORE_A = '11111111-1111-4111-8111-111111111111';
const STORE_B = '22222222-2222-4222-8222-222222222222';

describe('ListReportReferredPatientsUseCase', () => {
  function createHarness() {
    const repo = new InMemoryReportReferredPatientsRepository();
    const useCase = new ListReportReferredPatientsUseCase(repo);
    return { repo, useCase };
  }

  it('includes indicacao_profissional_externo with external professional name', async () => {
    const { repo, useCase } = createHarness();
    repo.seed([
      {
        id: 'p-ext',
        storeId: STORE_A,
        systemKey: 'indicacao_profissional_externo',
        name: 'Diana',
        createdAt: '2026-07-19T10:00:00.000Z',
        firstAppointmentDate: null,
        approvedBudgetsCount: 0,
        referredBy: 'Dr. Externo',
      },
    ]);

    const result = await useCase.execute({
      storeId: STORE_A,
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    });

    expect(result.total).toBe(1);
    expect(result.items[0]?.referredBy).toBe('Dr. Externo');
  });

  it('lists patients with referralSource indicacao in createdAt range', async () => {
    const { repo, useCase } = createHarness();
    repo.seed([
      {
        id: 'p1',
        storeId: STORE_A,
        systemKey: 'indicacao',
        name: 'Ana',
        createdAt: '2026-07-18T10:00:00.000Z',
        firstAppointmentDate: '2026-07-20',
        approvedBudgetsCount: 2,
      },
      {
        id: 'p2',
        storeId: STORE_A,
        systemKey: 'google',
        name: 'Bruno',
        createdAt: '2026-07-15T10:00:00.000Z',
        firstAppointmentDate: null,
        approvedBudgetsCount: 0,
      },
      {
        id: 'p3',
        storeId: STORE_A,
        systemKey: 'indicacao',
        name: 'Carla',
        createdAt: '2026-06-10T10:00:00.000Z',
        firstAppointmentDate: null,
        approvedBudgetsCount: 1,
      },
    ]);

    const result = await useCase.execute({
      storeId: STORE_A,
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    });

    expect(result.total).toBe(1);
    expect(result.items[0]?.id).toBe('p1');
    expect(result.items[0]?.referredPatientName).toBe('Ana');
    expect(result.items[0]?.referredBy).toBe('Não informado');
    expect(result.items[0]?.referralDate).toBe('2026-07-18');
    expect(result.items[0]?.firstAppointmentDate).toBe('2026-07-20');
    expect(result.items[0]?.approvedBudgetsCount).toBe(2);
  });

  it('includes patients without appointment and with zero budgets', async () => {
    const { repo, useCase } = createHarness();
    repo.seed([
      {
        id: 'p-new',
        storeId: STORE_A,
        systemKey: 'indicacao',
        name: 'Elena',
        createdAt: '2026-07-12T08:00:00.000Z',
        firstAppointmentDate: null,
        approvedBudgetsCount: 0,
      },
    ]);

    const result = await useCase.execute({
      storeId: STORE_A,
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    });

    expect(result.total).toBe(1);
    expect(result.items[0]?.firstAppointmentDate).toBeNull();
    expect(result.items[0]?.approvedBudgetsCount).toBe(0);
  });

  it('scopes by storeId and paginates', async () => {
    const { repo, useCase } = createHarness();
    repo.seed([
      {
        id: 'a1',
        storeId: STORE_A,
        systemKey: 'indicacao',
        name: 'A',
        createdAt: '2026-07-10T10:00:00.000Z',
        firstAppointmentDate: null,
        approvedBudgetsCount: 0,
      },
      {
        id: 'a2',
        storeId: STORE_A,
        systemKey: 'indicacao',
        name: 'B',
        createdAt: '2026-07-18T10:00:00.000Z',
        firstAppointmentDate: null,
        approvedBudgetsCount: 1,
      },
      {
        id: 'b1',
        storeId: STORE_B,
        systemKey: 'indicacao',
        name: 'C',
        createdAt: '2026-07-15T10:00:00.000Z',
        firstAppointmentDate: null,
        approvedBudgetsCount: 0,
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
    expect(page1.items[0]?.referralDate).toBe('2026-07-18');
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
