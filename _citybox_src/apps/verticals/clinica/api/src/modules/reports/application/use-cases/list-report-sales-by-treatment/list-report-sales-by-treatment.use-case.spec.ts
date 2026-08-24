import { ListReportSalesByTreatmentUseCase } from './list-report-sales-by-treatment.use-case';
import { InMemoryReportSalesByTreatmentRepository } from '../../../tests/in-memory-report-sales-by-treatment.repository';

const STORE_A = '11111111-1111-4111-8111-111111111111';
const STORE_B = '22222222-2222-4222-8222-222222222222';

describe('ListReportSalesByTreatmentUseCase', () => {
  function createHarness() {
    const repo = new InMemoryReportSalesByTreatmentRepository();
    const useCase = new ListReportSalesByTreatmentUseCase(repo);
    return { repo, useCase };
  }

  it('lists approved budget items whose approvedAt is in range', async () => {
    const { repo, useCase } = createHarness();
    repo.seed([
      {
        id: 'i1',
        storeId: STORE_A,
        budgetStatus: 'approved',
        approvedAt: '2026-07-18',
        budgetDate: '2026-07-10',
        treatmentName: 'Aparelho',
        planName: 'Ortodontia',
        patientName: 'Ana',
        valueCents: 320000,
      },
      {
        id: 'i2',
        storeId: STORE_A,
        budgetStatus: 'approved',
        approvedAt: '2026-06-15',
        budgetDate: '2026-06-10',
        treatmentName: 'Clareamento',
        planName: 'Estética',
        patientName: 'Bruno',
        valueCents: 89000,
      },
    ]);

    const result = await useCase.execute({
      storeId: STORE_A,
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    });

    expect(result.total).toBe(1);
    expect(result.items[0]?.id).toBe('i1');
    expect(result.items[0]?.treatmentName).toBe('Aparelho');
    expect(result.items[0]?.planName).toBe('Ortodontia');
    expect(result.items[0]?.saleDate).toBe('2026-07-18');
    expect(result.items[0]?.valueCents).toBe(320000);
  });

  it('falls back to budget date when approvedAt is null', async () => {
    const { repo, useCase } = createHarness();
    repo.seed([
      {
        id: 'i-legacy',
        storeId: STORE_A,
        budgetStatus: 'approved',
        approvedAt: null,
        budgetDate: '2026-07-21',
        treatmentName: null,
        planName: null,
        patientName: 'Leo',
        valueCents: 22000,
      },
    ]);

    const result = await useCase.execute({
      storeId: STORE_A,
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    });

    expect(result.total).toBe(1);
    expect(result.items[0]?.saleDate).toBe('2026-07-21');
    expect(result.items[0]?.treatmentName).toBe('Não informado');
    expect(result.items[0]?.planName).toBe('Não informado');
  });

  it('excludes pending and rejected budgets', async () => {
    const { repo, useCase } = createHarness();
    repo.seed([
      {
        id: 'i-pending',
        storeId: STORE_A,
        budgetStatus: 'pending',
        approvedAt: null,
        budgetDate: '2026-07-10',
        treatmentName: 'X',
        planName: 'Estética',
        patientName: 'P',
        valueCents: 1000,
      },
      {
        id: 'i-rejected',
        storeId: STORE_A,
        budgetStatus: 'rejected',
        approvedAt: null,
        budgetDate: '2026-07-15',
        treatmentName: 'Y',
        planName: 'Estética',
        patientName: 'R',
        valueCents: 2000,
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
        id: 'i-a1',
        storeId: STORE_A,
        budgetStatus: 'approved',
        approvedAt: '2026-07-10',
        budgetDate: '2026-07-08',
        treatmentName: 'A',
        planName: 'Particular',
        patientName: 'Alice',
        valueCents: 1,
      },
      {
        id: 'i-a2',
        storeId: STORE_A,
        budgetStatus: 'approved',
        approvedAt: '2026-07-18',
        budgetDate: '2026-07-16',
        treatmentName: 'C',
        planName: 'Estética',
        patientName: 'Carla',
        valueCents: 2,
      },
      {
        id: 'i-b',
        storeId: STORE_B,
        budgetStatus: 'approved',
        approvedAt: '2026-07-15',
        budgetDate: '2026-07-14',
        treatmentName: 'B',
        planName: 'Estética',
        patientName: 'Bruno',
        valueCents: 3,
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
    expect(page1.items[0]?.saleDate).toBe('2026-07-18');
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
