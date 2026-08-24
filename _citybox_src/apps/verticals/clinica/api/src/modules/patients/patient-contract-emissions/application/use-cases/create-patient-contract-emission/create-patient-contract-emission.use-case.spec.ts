import { ContractModelNotFoundError } from '../../../../../contract-models/domain/errors/contract-model-not-found.error';
import { PatientContractEmissionBudgetDuplicateError } from '../../../domain/errors/patient-contract-emission-budget-duplicate.error';
import { BudgetNotApprovedForContractError } from '../../../domain/errors/budget-not-approved-for-contract.error';
import { STORE_A } from '../../../tests/patient-contract-emissions-test.fixtures';
import {
  BUDGET_A,
  createPatientContractEmissionsTestHarness,
  PATIENT_A,
  SAMPLE_CONTRACT_INPUT,
  seedApprovedBudget,
  seedContractTemplate,
  seedPatient,
} from '../../../tests/patient-contract-emissions-test.fixtures';
import { Budget } from '../../../../patient-budgets/domain/entities/budget.entity';

describe('CreatePatientContractEmissionUseCase', () => {
  it('creates a contract emission with denormalized names', async () => {
    const harness = createPatientContractEmissionsTestHarness();
    seedPatient(harness);
    await seedContractTemplate(harness);

    const result = await harness.createPatientContractEmission.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      input: SAMPLE_CONTRACT_INPUT,
    });

    expect(result.templateName).toBe('Contrato Padrão');
    expect(result.patientName).toBe('Maria');
    expect(result.responsibleName).toBe('Dr. João');
    expect(result.issuedVia).toBe('manual');
    expect(result.budgetId).toBeNull();
  });

  it('creates a contract linked to an approved budget', async () => {
    const harness = createPatientContractEmissionsTestHarness();
    seedPatient(harness);
    await seedContractTemplate(harness);
    await seedApprovedBudget(harness);

    const result = await harness.createPatientContractEmission.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      input: { ...SAMPLE_CONTRACT_INPUT, budgetId: BUDGET_A },
    });

    expect(result.budgetId).toBe(BUDGET_A);
  });

  it('rejects duplicate contract for the same budget', async () => {
    const harness = createPatientContractEmissionsTestHarness();
    seedPatient(harness);
    await seedContractTemplate(harness);
    await seedApprovedBudget(harness);

    await harness.createPatientContractEmission.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      input: { ...SAMPLE_CONTRACT_INPUT, budgetId: BUDGET_A },
    });

    await expect(
      harness.createPatientContractEmission.execute({
        storeId: STORE_A,
        patientId: PATIENT_A,
        input: { ...SAMPLE_CONTRACT_INPUT, budgetId: BUDGET_A },
      }),
    ).rejects.toBeInstanceOf(PatientContractEmissionBudgetDuplicateError);
  });

  it('rejects contract for non-approved budget', async () => {
    const harness = createPatientContractEmissionsTestHarness();
    seedPatient(harness);
    await seedContractTemplate(harness);
    await harness.budgetRepo.save({
      budget: Budget.create(
        {
          storeId: STORE_A,
          patientId: PATIENT_A,
          description: 'Em aberto',
          date: new Date('2026-07-01'),
          responsibleId: 'resp-1',
          responsibleName: 'Dr. João',
          subtotalCents: 100_00,
          finalValueCents: 100_00,
          status: 'pending',
        },
        BUDGET_A,
      ),
      items: [],
    });

    await expect(
      harness.createPatientContractEmission.execute({
        storeId: STORE_A,
        patientId: PATIENT_A,
        input: { ...SAMPLE_CONTRACT_INPUT, budgetId: BUDGET_A },
      }),
    ).rejects.toBeInstanceOf(BudgetNotApprovedForContractError);
  });

  it('throws when template does not exist', async () => {
    const harness = createPatientContractEmissionsTestHarness();
    seedPatient(harness);

    await expect(
      harness.createPatientContractEmission.execute({
        storeId: STORE_A,
        patientId: PATIENT_A,
        input: SAMPLE_CONTRACT_INPUT,
      }),
    ).rejects.toBeInstanceOf(ContractModelNotFoundError);
  });
});
