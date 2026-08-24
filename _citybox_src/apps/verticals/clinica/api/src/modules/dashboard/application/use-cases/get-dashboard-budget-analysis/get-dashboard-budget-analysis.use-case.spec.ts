import {
  createBudgetFixture,
  createBudgetItemFixture,
  InMemoryBudgetRepository,
} from '../../../../patients/patient-budgets/tests/in-memory-budget.repository';
import { GetDashboardBudgetAnalysisUseCase } from './get-dashboard-budget-analysis.use-case';

describe('GetDashboardBudgetAnalysisUseCase', () => {
  const storeId = 'store-1';

  function createUseCase() {
    const budgetRepo = new InMemoryBudgetRepository();
    return {
      budgetRepo,
      useCase: new GetDashboardBudgetAnalysisUseCase(budgetRepo),
    };
  }

  it('aggregates professionals by responsible with budget count', async () => {
    const { budgetRepo, useCase } = createUseCase();
    budgetRepo.seedPatientName('p1', 'Ana');

    budgetRepo.seed({
      budget: createBudgetFixture(
        {
          storeId,
          patientId: 'p1',
          status: 'approved',
          date: new Date('2026-07-01T00:00:00.000Z'),
          responsibleId: 'resp-a',
          responsibleName: 'Dra. A',
          finalValueCents: 100_000,
        },
        'b1',
      ),
      items: [
        createBudgetItemFixture('b1', storeId, { valueCents: 50_000 }, 'i1'),
        createBudgetItemFixture('b1', storeId, { valueCents: 50_000 }, 'i2'),
      ],
    });
    budgetRepo.seed({
      budget: createBudgetFixture(
        {
          storeId,
          patientId: 'p1',
          status: 'approved',
          date: new Date('2026-07-02T00:00:00.000Z'),
          responsibleId: 'resp-a',
          responsibleName: 'Dra. A',
          finalValueCents: 30_000,
        },
        'b2',
      ),
      items: [],
    });

    const result = await useCase.execute({
      storeId,
      status: 'approved',
      dimension: 'professionals',
      periodMode: 'monthly',
      year: 2026,
      month: 7,
    });

    expect(result.items).toEqual([
      { key: 'resp-a', name: 'Dra. A', count: 2, totalCents: 130_000 },
    ]);
  });

  it('aggregates treatments by distinct budgets and item valueCents', async () => {
    const { budgetRepo, useCase } = createUseCase();
    budgetRepo.seedPatientName('p1', 'Ana');

    budgetRepo.seed({
      budget: createBudgetFixture(
        {
          storeId,
          patientId: 'p1',
          status: 'approved',
          date: new Date('2026-07-01T00:00:00.000Z'),
          finalValueCents: 100_000,
        },
        'b1',
      ),
      items: [
        createBudgetItemFixture(
          'b1',
          storeId,
          {
            treatmentId: 'trt-clareamento',
            treatmentName: 'Clareamento',
            valueCents: 60_000,
          },
          'i1',
        ),
        createBudgetItemFixture(
          'b1',
          storeId,
          {
            treatmentId: 'trt-clareamento',
            treatmentName: 'Clareamento',
            valueCents: 40_000,
          },
          'i2',
        ),
      ],
    });
    budgetRepo.seed({
      budget: createBudgetFixture(
        {
          storeId,
          patientId: 'p1',
          status: 'approved',
          date: new Date('2026-07-03T00:00:00.000Z'),
          finalValueCents: 80_000,
        },
        'b2',
      ),
      items: [
        createBudgetItemFixture(
          'b2',
          storeId,
          {
            treatmentId: 'trt-clareamento',
            treatmentName: 'Clareamento',
            valueCents: 80_000,
          },
          'i3',
        ),
      ],
    });

    const result = await useCase.execute({
      storeId,
      status: 'approved',
      dimension: 'treatments',
      periodMode: 'monthly',
      year: 2026,
      month: 7,
    });

    expect(result.items).toEqual([
      {
        key: 'trt-clareamento',
        name: 'Clareamento',
        count: 2,
        totalCents: 180_000,
      },
    ]);
  });
});
