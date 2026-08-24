import { BudgetInvalidPricingError } from '../../../domain/errors/budget-invalid-pricing.error';
import { PatientNotFoundError } from '../../../../domain/errors/patient-not-found.error';
import {
  STORE_A,
  buildBudgetInput,
  createBudgetsTestHarness,
  PATIENT_A,
} from '../../../tests/budgets-test.fixtures';

describe('CreateBudgetUseCase', () => {
  it('creates a pending budget with items', async () => {
    const { createBudget } = createBudgetsTestHarness();

    const detail = await createBudget.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      input: buildBudgetInput(),
    });

    expect(detail.budget.status).toBe('pending');
    expect(detail.budget.finalValueCents).toBe(5000);
    expect(detail.items).toHaveLength(1);
    expect(detail.items[0]?.treatmentName).toBe('Consulta');
  });

  it('applies percent discount (centesimal: 1000 = 10%)', async () => {
    const { createBudget } = createBudgetsTestHarness();

    const detail = await createBudget.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      input: buildBudgetInput({
        discount: { type: 'percent', value: 1000 },
      }),
    });

    expect(detail.budget.subtotalCents).toBe(5000);
    expect(detail.budget.finalValueCents).toBe(4500);
  });

  it('keeps final value when approving-path percent is 20% (value 2000)', async () => {
    const { createBudget } = createBudgetsTestHarness();

    const detail = await createBudget.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      input: buildBudgetInput({
        discount: { type: 'percent', value: 2000 },
      }),
    });

    expect(detail.budget.subtotalCents).toBe(5000);
    expect(detail.budget.finalValueCents).toBe(4000);
    expect(detail.budget.discountValue).toBe(2000);
  });

  it('rejects budget without items', async () => {
    const { createBudget } = createBudgetsTestHarness();

    await expect(
      createBudget.execute({
        storeId: STORE_A,
        patientId: PATIENT_A,
        input: buildBudgetInput({ items: [] }),
      }),
    ).rejects.toBeInstanceOf(BudgetInvalidPricingError);
  });

  it('rejects unknown patient', async () => {
    const { createBudget } = createBudgetsTestHarness();

    await expect(
      createBudget.execute({
        storeId: STORE_A,
        patientId: '00000000-0000-4000-8000-000000000099',
        input: buildBudgetInput(),
      }),
    ).rejects.toBeInstanceOf(PatientNotFoundError);
  });
});
