import { DeleteBudgetUseCase } from './delete-budget.use-case';
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

describe('DeleteBudgetUseCase', () => {
  it('deletes a pending budget', async () => {
    const harness = createBudgetsTestHarness();
    const created = await harness.createBudget.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      input: buildBudgetInput(),
    });

    await harness.deleteBudget.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      budgetId: created.budget.id,
    });

    const remaining = await harness.listBudgets.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
    });
    expect(remaining.items).toHaveLength(0);
  });

  it('blocks delete when budget is approved', async () => {
    const harness = createBudgetsTestHarness();
    const budgetRepo = harness.budgetRepo;
    const budget = createBudgetFixture({
      storeId: STORE_A,
      patientId: PATIENT_A,
      status: 'approved',
    });
    budgetRepo.seed({
      budget,
      items: [createBudgetItemFixture(budget.id, STORE_A)],
    });

    const deleteBudget = new DeleteBudgetUseCase(
      budgetRepo,
      harness.assertPatientExists,
      harness.syncSalesOpportunity,
    );

    await expect(
      deleteBudget.execute({
        storeId: STORE_A,
        patientId: PATIENT_A,
        budgetId: budget.id,
      }),
    ).rejects.toBeInstanceOf(BudgetFrozenError);
  });
});
