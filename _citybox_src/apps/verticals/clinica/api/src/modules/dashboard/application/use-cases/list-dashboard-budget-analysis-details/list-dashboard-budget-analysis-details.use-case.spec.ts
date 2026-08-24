import {
  createBudgetFixture,
  createBudgetItemFixture,
  InMemoryBudgetRepository,
} from '../../../../patients/patient-budgets/tests/in-memory-budget.repository';
import { ListDashboardBudgetAnalysisDetailsUseCase } from './list-dashboard-budget-analysis-details.use-case';

describe('ListDashboardBudgetAnalysisDetailsUseCase', () => {
  const storeId = 'store-1';

  function createUseCase() {
    const budgetRepo = new InMemoryBudgetRepository();
    return {
      budgetRepo,
      useCase: new ListDashboardBudgetAnalysisDetailsUseCase(budgetRepo),
    };
  }

  it('lists status details with pagination and patient search', async () => {
    const { budgetRepo, useCase } = createUseCase();
    budgetRepo.seedPatientName('p1', 'Ana Souza');
    budgetRepo.seedPatientName('p2', 'Bruno Lima');

    budgetRepo.seed({
      budget: createBudgetFixture(
        {
          storeId,
          patientId: 'p1',
          status: 'approved',
          date: new Date('2026-07-10T00:00:00.000Z'),
          finalValueCents: 10_000,
          description: 'Orçamento Ana',
        },
        'b1',
      ),
      items: [],
    });
    budgetRepo.seed({
      budget: createBudgetFixture(
        {
          storeId,
          patientId: 'p2',
          status: 'approved',
          date: new Date('2026-07-11T00:00:00.000Z'),
          finalValueCents: 20_000,
          description: 'Orçamento Bruno',
        },
        'b2',
      ),
      items: [],
    });

    const result = await useCase.execute({
      storeId,
      status: 'approved',
      periodMode: 'monthly',
      year: 2026,
      month: 7,
      search: 'ana',
      page: 1,
      perPage: 20,
    });

    expect(result.total).toBe(1);
    expect(result.totalValueCents).toBe(10_000);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.patientName).toBe('Ana Souza');
    expect(result.items[0]?.status).toBe('approved');
  });

  it('filters by treatment dimensionKey using distinct budgets', async () => {
    const { budgetRepo, useCase } = createUseCase();
    budgetRepo.seedPatientName('p1', 'Ana');

    budgetRepo.seed({
      budget: createBudgetFixture(
        {
          storeId,
          patientId: 'p1',
          status: 'pending',
          date: new Date('2026-07-02T00:00:00.000Z'),
          finalValueCents: 50_000,
        },
        'b-open',
      ),
      items: [
        createBudgetItemFixture(
          'b-open',
          storeId,
          {
            treatmentId: 'trt-x',
            treatmentName: 'Tratamento X',
            valueCents: 50_000,
          },
          'i1',
        ),
      ],
    });
    budgetRepo.seed({
      budget: createBudgetFixture(
        {
          storeId,
          patientId: 'p1',
          status: 'pending',
          date: new Date('2026-07-03T00:00:00.000Z'),
          finalValueCents: 40_000,
        },
        'b-other',
      ),
      items: [
        createBudgetItemFixture(
          'b-other',
          storeId,
          {
            treatmentId: 'trt-y',
            treatmentName: 'Tratamento Y',
            valueCents: 40_000,
          },
          'i2',
        ),
      ],
    });

    const result = await useCase.execute({
      storeId,
      status: 'open',
      periodMode: 'monthly',
      year: 2026,
      month: 7,
      dimension: 'treatments',
      dimensionKey: 'trt-x',
    });

    expect(result.total).toBe(1);
    expect(result.items[0]?.id).toBe('b-open');
    expect(result.items[0]?.treatmentId).toBe('trt-x');
  });
});
