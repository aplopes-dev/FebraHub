import { FindBudgetByIdUseCase } from './find-budget-by-id.use-case';
import { BudgetNotFoundError } from '../../../domain/errors/budget-not-found.error';
import {
  STORE_A,
  buildBudgetInput,
  createBudgetsTestHarness,
  PATIENT_A,
} from '../../../tests/budgets-test.fixtures';

describe('FindBudgetByIdUseCase', () => {
  it('returns budget detail', async () => {
    const harness = createBudgetsTestHarness();
    const created = await harness.createBudget.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      input: buildBudgetInput(),
    });

    const detail = await harness.findBudgetById.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      budgetId: created.budget.id,
    });

    expect(detail.budget.id).toBe(created.budget.id);
    expect(detail.items).toHaveLength(1);
  });

  it('throws when budget not found', async () => {
    const harness = createBudgetsTestHarness();

    await expect(
      harness.findBudgetById.execute({
        storeId: STORE_A,
        patientId: PATIENT_A,
        budgetId: '00000000-0000-4000-8000-000000000099',
      }),
    ).rejects.toBeInstanceOf(BudgetNotFoundError);
  });
});
