import {
  createBudgetFixture,
  createBudgetItemFixture,
  InMemoryBudgetRepository,
} from '../../../../patients/patient-budgets/tests/in-memory-budget.repository';
import { GetDashboardBudgetAnalysisStatusUseCase } from './get-dashboard-budget-analysis-status.use-case';

describe('GetDashboardBudgetAnalysisStatusUseCase', () => {
  const storeId = 'store-1';

  function createUseCase() {
    const budgetRepo = new InMemoryBudgetRepository();
    return {
      budgetRepo,
      useCase: new GetDashboardBudgetAnalysisStatusUseCase(budgetRepo),
    };
  }

  it('summarizes by budget (not item), maps pending→open, excludes expired', async () => {
    const { budgetRepo, useCase } = createUseCase();
    budgetRepo.seedPatientName('patient-1', 'Ana Souza');

    const multiItem = createBudgetFixture(
      {
        storeId,
        patientId: 'patient-1',
        status: 'approved',
        date: new Date('2026-07-10T00:00:00.000Z'),
        finalValueCents: 100_000,
        responsibleId: 'resp-marina',
        responsibleName: 'Dra. Marina',
      },
      'b-approved',
    );
    budgetRepo.seed({
      budget: multiItem,
      items: [
        createBudgetItemFixture(
          multiItem.id,
          storeId,
          { valueCents: 60_000 },
          'i1',
        ),
        createBudgetItemFixture(
          multiItem.id,
          storeId,
          { valueCents: 40_000 },
          'i2',
        ),
      ],
    });

    budgetRepo.seed({
      budget: createBudgetFixture(
        {
          storeId,
          patientId: 'patient-1',
          status: 'pending',
          date: new Date('2026-07-11T00:00:00.000Z'),
          finalValueCents: 50_000,
          responsibleId: 'resp-marina',
          responsibleName: 'Dra. Marina',
        },
        'b-open',
      ),
      items: [],
    });

    budgetRepo.seed({
      budget: createBudgetFixture(
        {
          storeId,
          patientId: 'patient-1',
          status: 'expired',
          date: new Date('2026-07-12T00:00:00.000Z'),
          finalValueCents: 999_000,
        },
        'b-expired',
      ),
      items: [],
    });

    const result = await useCase.execute({
      storeId,
      periodMode: 'monthly',
      year: 2026,
      month: 7,
    });

    expect(result.summary.approved.count).toBe(1);
    expect(result.summary.approved.totalCents).toBe(100_000);
    expect(result.summary.open.count).toBe(1);
    expect(result.summary.rejected.count).toBe(0);
    expect(result.summary.totalCount).toBe(2);
    expect(result.summary.approvalRate).toBe(50);
    expect(result.timeline).toHaveLength(31);
    expect(result.timeline[9]?.approved.count).toBe(1);
    expect(result.professionals).toEqual([
      { id: 'resp-marina', name: 'Dra. Marina' },
    ]);
  });

  it('filters by responsible and excludes other store', async () => {
    const { budgetRepo, useCase } = createUseCase();
    budgetRepo.seedPatientName('patient-1', 'Ana');
    budgetRepo.seed({
      budget: createBudgetFixture(
        {
          storeId,
          patientId: 'patient-1',
          status: 'approved',
          date: new Date('2026-07-01T00:00:00.000Z'),
          responsibleId: 'resp-a',
          responsibleName: 'A',
          finalValueCents: 10_000,
        },
        'b1',
      ),
      items: [],
    });
    budgetRepo.seed({
      budget: createBudgetFixture(
        {
          storeId,
          patientId: 'patient-1',
          status: 'approved',
          date: new Date('2026-07-02T00:00:00.000Z'),
          responsibleId: 'resp-b',
          responsibleName: 'B',
          finalValueCents: 20_000,
        },
        'b2',
      ),
      items: [],
    });
    budgetRepo.seed({
      budget: createBudgetFixture(
        {
          storeId: 'store-2',
          patientId: 'patient-1',
          status: 'approved',
          date: new Date('2026-07-03T00:00:00.000Z'),
          responsibleId: 'resp-a',
          responsibleName: 'A',
          finalValueCents: 99_000,
        },
        'b-other',
      ),
      items: [],
    });

    const result = await useCase.execute({
      storeId,
      periodMode: 'annual',
      year: 2026,
      professionalId: 'resp-a',
    });

    expect(result.summary.approved.count).toBe(1);
    expect(result.summary.approved.totalCents).toBe(10_000);
  });
});
