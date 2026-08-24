import {
  createBudgetFixture,
  InMemoryBudgetRepository,
} from '../../../../patients/patient-budgets/tests/in-memory-budget.repository';
import { ListDashboardBudgetsUseCase } from './list-dashboard-budgets.use-case';

describe('ListDashboardBudgetsUseCase', () => {
  const storeId = 'store-1';

  function createUseCase() {
    const budgetRepo = new InMemoryBudgetRepository();
    return {
      budgetRepo,
      useCase: new ListDashboardBudgetsUseCase(budgetRepo),
    };
  }

  function seedBudget(
    budgetRepo: InMemoryBudgetRepository,
    overrides: {
      id: string;
      storeId?: string;
      patientId?: string;
      status?: 'pending' | 'approved' | 'rejected';
      date?: Date;
      description?: string;
      finalValueCents?: number;
    },
  ) {
    const budget = createBudgetFixture(
      {
        storeId: overrides.storeId ?? storeId,
        patientId: overrides.patientId ?? 'patient-1',
        status: overrides.status ?? 'pending',
        date: overrides.date ?? new Date('2026-07-01'),
        description: overrides.description ?? 'Orçamento teste',
        finalValueCents: overrides.finalValueCents ?? 5000,
        subtotalCents: overrides.finalValueCents ?? 5000,
      },
      overrides.id,
    );
    budgetRepo.seed({ budget, items: [] });
  }

  it('lista apenas orçamentos pendentes e reprovados da loja, mais recentes primeiro', async () => {
    const { budgetRepo, useCase } = createUseCase();
    budgetRepo.seedPatientName('patient-1', 'Ana Souza');
    budgetRepo.seedPatientName('patient-2', 'Bruno Lima');

    seedBudget(budgetRepo, {
      id: 'b-open',
      patientId: 'patient-1',
      status: 'pending',
      date: new Date('2026-07-10'),
      finalValueCents: 10_000,
    });
    seedBudget(budgetRepo, {
      id: 'b-rejected',
      patientId: 'patient-2',
      status: 'rejected',
      date: new Date('2026-07-15'),
      finalValueCents: 20_000,
    });
    seedBudget(budgetRepo, {
      id: 'b-approved',
      status: 'approved',
      finalValueCents: 99_000,
    });
    seedBudget(budgetRepo, {
      id: 'b-other-store',
      storeId: 'store-2',
      status: 'pending',
      finalValueCents: 77_000,
    });

    const result = await useCase.execute({ storeId });

    expect(result.total).toBe(2);
    expect(result.totalValueCents).toBe(30_000);
    expect(result.items.map((item) => item.id)).toEqual([
      'b-rejected',
      'b-open',
    ]);
    expect(result.items[0]).toMatchObject({
      patientName: 'Bruno Lima',
      status: 'rejected',
      valueCents: 20_000,
      budgetDate: '2026-07-15',
    });
    expect(result.items[1]).toMatchObject({
      patientName: 'Ana Souza',
      status: 'open',
      valueCents: 10_000,
    });
  });

  it('pagina server-side e mantém total/totalValueCents do conjunto completo', async () => {
    const { budgetRepo, useCase } = createUseCase();
    budgetRepo.seedPatientName('patient-1', 'Ana Souza');

    for (let index = 0; index < 5; index += 1) {
      seedBudget(budgetRepo, {
        id: `b-${index}`,
        date: new Date(`2026-07-0${index + 1}`),
        finalValueCents: 1_000,
      });
    }

    const result = await useCase.execute({ storeId, page: 2, perPage: 2 });

    expect(result.items).toHaveLength(2);
    expect(result.items.map((item) => item.id)).toEqual(['b-2', 'b-1']);
    expect(result.total).toBe(5);
    expect(result.totalValueCents).toBe(5_000);
    expect(result.page).toBe(2);
    expect(result.perPage).toBe(2);
    expect(result.totalPages).toBe(3);
  });

  it('retorna lista vazia quando não há orçamentos abertos/reprovados', async () => {
    const { budgetRepo, useCase } = createUseCase();
    seedBudget(budgetRepo, { id: 'b-approved', status: 'approved' });

    const result = await useCase.execute({ storeId });

    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.totalValueCents).toBe(0);
    expect(result.totalPages).toBe(0);
  });
});
