import {
  createBudgetFixture,
  createBudgetItemFixture,
  InMemoryBudgetRepository,
} from '../../../../patients/patient-budgets/tests/in-memory-budget.repository';
import { InMemoryDashboardSalesGoalRepository } from '../../../tests/in-memory-dashboard-sales-goal.repository';
import { GetDashboardSalesGoalsUseCase } from './get-dashboard-sales-goals.use-case';
import { UpsertDashboardSalesGoalUseCase } from '../upsert-dashboard-sales-goal/upsert-dashboard-sales-goal.use-case';

describe('Dashboard sales goals (meta contínua)', () => {
  const storeId = 'store-1';
  const otherStoreId = 'store-2';
  const now = new Date('2026-07-17T12:00:00.000Z');

  function createStack() {
    const goalRepo = new InMemoryDashboardSalesGoalRepository();
    const budgetRepo = new InMemoryBudgetRepository();
    return {
      goalRepo,
      budgetRepo,
      get: new GetDashboardSalesGoalsUseCase(goalRepo, budgetRepo),
      upsert: new UpsertDashboardSalesGoalUseCase(goalRepo),
    };
  }

  function seedApprovedBudget(
    budgetRepo: InMemoryBudgetRepository,
    overrides: {
      id: string;
      storeId?: string;
      patientId?: string;
      approvedAt: Date;
      itemCents: number[];
      status?: 'approved' | 'pending' | 'rejected';
    },
  ) {
    const store = overrides.storeId ?? storeId;
    const patientId = overrides.patientId ?? 'patient-1';
    budgetRepo.seedPatientName(patientId, 'Paciente');
    const subtotal = overrides.itemCents.reduce((a, b) => a + b, 0);
    const budget = createBudgetFixture(
      {
        storeId: store,
        patientId,
        status: overrides.status ?? 'approved',
        approvedAt: overrides.approvedAt,
        finalValueCents: subtotal,
        subtotalCents: subtotal,
      },
      overrides.id,
    );
    budgetRepo.seed({
      budget,
      items: overrides.itemCents.map((valueCents, index) =>
        createBudgetItemFixture(
          overrides.id,
          store,
          {
            valueCents,
            sortOrder: index,
          },
          `${overrides.id}-item-${index}`,
        ),
      ),
    });
  }

  it('returns empty summary when there is no active goal', async () => {
    const { budgetRepo, get } = createStack();
    seedApprovedBudget(budgetRepo, {
      id: 'budget-a',
      approvedAt: new Date('2026-07-03T15:00:00.000Z'),
      itemCents: [50_000],
    });

    const result = await get.execute({ storeId, now });

    expect(result).toEqual({
      goalCents: null,
      startDate: null,
      realizedCents: 0,
      soldTodayCents: 0,
      reached: false,
      dailySales: [],
    });
  });

  it('accumulates approved budgets from goal startDate, crossing month boundaries', async () => {
    const { budgetRepo, upsert, get } = createStack();

    await upsert.execute({
      storeId,
      goalCents: 20_000_000,
      now: new Date('2026-06-20T12:00:00.000Z'),
    });

    // antes da meta — não conta
    seedApprovedBudget(budgetRepo, {
      id: 'budget-before',
      approvedAt: new Date('2026-06-10T12:00:00.000Z'),
      itemCents: [999_000],
    });
    // junho, após a criação da meta
    seedApprovedBudget(budgetRepo, {
      id: 'budget-june',
      approvedAt: new Date('2026-06-25T12:00:00.000Z'),
      itemCents: [40_000],
    });
    // julho (virada de mês não reseta)
    seedApprovedBudget(budgetRepo, {
      id: 'budget-july',
      approvedAt: new Date('2026-07-17T08:00:00.000Z'),
      itemCents: [89_000],
    });
    // pendente — não conta
    seedApprovedBudget(budgetRepo, {
      id: 'budget-pending',
      approvedAt: new Date('2026-07-10T12:00:00.000Z'),
      itemCents: [777_000],
      status: 'pending',
    });

    const result = await get.execute({ storeId, now });

    expect(result.goalCents).toBe(20_000_000);
    expect(result.startDate).toBe('2026-06-20');
    expect(result.realizedCents).toBe(129_000);
    expect(result.soldTodayCents).toBe(89_000);
    expect(result.reached).toBe(false);
    expect(result.dailySales).toEqual([
      { date: '2026-06-25', valueCents: 40_000 },
      { date: '2026-07-17', valueCents: 89_000 },
    ]);
  });

  it('counts sales approved on the goal creation day (inclusive)', async () => {
    const { budgetRepo, upsert, get } = createStack();
    await upsert.execute({ storeId, goalCents: 1_000_000, now });
    seedApprovedBudget(budgetRepo, {
      id: 'budget-same-day',
      approvedAt: new Date('2026-07-17T09:00:00.000Z'),
      itemCents: [30_000],
    });

    const result = await get.execute({ storeId, now });
    expect(result.realizedCents).toBe(30_000);
    expect(result.soldTodayCents).toBe(30_000);
  });

  it('keeps accumulating after the goal is reached (reached=true)', async () => {
    const { budgetRepo, upsert, get } = createStack();
    await upsert.execute({
      storeId,
      goalCents: 100_000,
      now: new Date('2026-07-01T12:00:00.000Z'),
    });
    seedApprovedBudget(budgetRepo, {
      id: 'budget-1',
      approvedAt: new Date('2026-07-05T12:00:00.000Z'),
      itemCents: [90_000],
    });
    seedApprovedBudget(budgetRepo, {
      id: 'budget-2',
      approvedAt: new Date('2026-07-10T12:00:00.000Z'),
      itemCents: [60_000],
    });

    const result = await get.execute({ storeId, now });
    expect(result.reached).toBe(true);
    expect(result.realizedCents).toBe(150_000);
  });

  it('replacing the goal restarts accumulation at the new startDate', async () => {
    const { budgetRepo, upsert, get } = createStack();
    await upsert.execute({
      storeId,
      goalCents: 100_000,
      now: new Date('2026-07-01T12:00:00.000Z'),
    });
    seedApprovedBudget(budgetRepo, {
      id: 'budget-old',
      approvedAt: new Date('2026-07-05T12:00:00.000Z'),
      itemCents: [90_000],
    });

    const replaced = await upsert.execute({
      storeId,
      goalCents: 200_000,
      now: new Date('2026-07-10T12:00:00.000Z'),
    });
    expect(replaced).toEqual({
      goalCents: 200_000,
      startDate: '2026-07-10',
    });

    seedApprovedBudget(budgetRepo, {
      id: 'budget-new',
      approvedAt: new Date('2026-07-12T12:00:00.000Z'),
      itemCents: [25_000],
    });

    const result = await get.execute({ storeId, now });
    expect(result.goalCents).toBe(200_000);
    expect(result.startDate).toBe('2026-07-10');
    expect(result.realizedCents).toBe(25_000);
    expect(result.reached).toBe(false);
  });

  it('ignores other stores (anti-IDOR)', async () => {
    const { budgetRepo, upsert, get } = createStack();
    await upsert.execute({
      storeId: otherStoreId,
      goalCents: 1_000_000,
      now: new Date('2026-07-01T12:00:00.000Z'),
    });
    seedApprovedBudget(budgetRepo, {
      id: 'budget-other',
      storeId: otherStoreId,
      approvedAt: new Date('2026-07-17T12:00:00.000Z'),
      itemCents: [50_000],
    });

    const result = await get.execute({ storeId, now });
    expect(result.goalCents).toBeNull();
    expect(result.realizedCents).toBe(0);
    expect(result.dailySales).toEqual([]);
  });

  it('rejects non-positive goalCents', async () => {
    const { upsert } = createStack();
    await expect(
      upsert.execute({ storeId, goalCents: 0, now }),
    ).rejects.toThrow('goalCents');
    await expect(
      upsert.execute({ storeId, goalCents: -5, now }),
    ).rejects.toThrow('goalCents');
  });
});
