import { ListReportSalesByProfessionalUseCase } from './list-report-sales-by-professional.use-case';
import { InMemoryReportSalesByProfessionalRepository } from '../../../tests/in-memory-report-sales-by-professional.repository';

const STORE_A = '11111111-1111-4111-8111-111111111111';
const STORE_B = '22222222-2222-4222-8222-222222222222';

describe('ListReportSalesByProfessionalUseCase', () => {
  function createHarness() {
    const repo = new InMemoryReportSalesByProfessionalRepository();
    const useCase = new ListReportSalesByProfessionalUseCase(repo);
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
        professionalName: 'Dra. Marina Alves',
        patientName: 'Ana',
        treatmentName: 'Aparelho',
        valueCents: 320000,
      },
      {
        id: 'i2',
        storeId: STORE_A,
        budgetStatus: 'approved',
        approvedAt: '2026-06-15',
        budgetDate: '2026-06-10',
        professionalName: 'Dr. Rafael Costa',
        patientName: 'Bruno',
        treatmentName: 'Clareamento',
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
    expect(result.items[0]?.professionalName).toBe('Dra. Marina Alves');
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
        professionalName: null,
        patientName: 'Leo',
        treatmentName: 'Limpeza',
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
    expect(result.items[0]?.professionalName).toBe('Não informado');
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
        professionalName: 'Dra. X',
        patientName: 'P',
        treatmentName: 'X',
        valueCents: 1000,
      },
      {
        id: 'i-rejected',
        storeId: STORE_A,
        budgetStatus: 'rejected',
        approvedAt: null,
        budgetDate: '2026-07-15',
        professionalName: 'Dra. Y',
        patientName: 'R',
        treatmentName: 'Y',
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
        professionalName: 'Dr. Pedro',
        patientName: 'Alice',
        treatmentName: 'A',
        valueCents: 1,
      },
      {
        id: 'i-a2',
        storeId: STORE_A,
        budgetStatus: 'approved',
        approvedAt: '2026-07-18',
        budgetDate: '2026-07-16',
        professionalName: 'Dra. Marina',
        patientName: 'Carla',
        treatmentName: 'C',
        valueCents: 2,
      },
      {
        id: 'i-b',
        storeId: STORE_B,
        budgetStatus: 'approved',
        approvedAt: '2026-07-15',
        budgetDate: '2026-07-14',
        professionalName: 'Dra. Marina',
        patientName: 'Bruno',
        treatmentName: 'B',
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
