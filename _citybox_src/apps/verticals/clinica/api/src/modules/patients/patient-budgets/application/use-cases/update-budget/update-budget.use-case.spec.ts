import { UpdateBudgetUseCase } from './update-budget.use-case';
import { BudgetFrozenError } from '../../../domain/errors/budget-frozen.error';
import {
  STORE_A,
  buildBudgetInput,
  createBudgetsTestHarness,
  PATIENT_A,
} from '../../../tests/budgets-test.fixtures';
import {
  createBudgetFixture,
  createBudgetItemFixture,
  InMemoryBudgetRepository,
} from '../../../tests/in-memory-budget.repository';

describe('UpdateBudgetUseCase', () => {
  it('updates a pending budget', async () => {
    const harness = createBudgetsTestHarness();
    const created = await harness.createBudget.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      input: buildBudgetInput(),
    });

    const detail = await harness.updateBudget.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      budgetId: created.budget.id,
      input: buildBudgetInput({ description: 'Orçamento revisado' }),
    });

    expect(detail.budget.description).toBe('Orçamento revisado');
  });

  it('blocks update when budget is approved', async () => {
    const harness = createBudgetsTestHarness();
    const budgetRepo = harness.budgetRepo;
    const budget = createBudgetFixture({
      storeId: STORE_A,
      patientId: PATIENT_A,
      status: 'approved',
    });
    const item = createBudgetItemFixture(budget.id, STORE_A);
    budgetRepo.seed({ budget, items: [item] });

    const updateBudget = new UpdateBudgetUseCase(
      budgetRepo,
      harness.assertPatientExists,
      harness.validateItemReferences,
    );

    await expect(
      updateBudget.execute({
        storeId: STORE_A,
        patientId: PATIENT_A,
        budgetId: budget.id,
        input: buildBudgetInput(),
      }),
    ).rejects.toBeInstanceOf(BudgetFrozenError);
  });
});
