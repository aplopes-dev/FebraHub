import { CreatePatientUseCase } from './create-patient.use-case';
import { PatientCpfTakenError } from '../../../domain/errors/patient-cpf-taken.error';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import {
  CATEGORY_A,
  STORE_A,
  STORE_B,
  VALID_CPF,
  createPatientsTestHarness,
  seedCategory,
} from '../../../tests/patients-test.fixtures';

describe('CreatePatientUseCase', () => {
  it('creates patient with valid CPF', async () => {
    const { createPatient } = createPatientsTestHarness();

    const detail = await createPatient.execute({
      storeId: STORE_A,
      input: {
        name: 'Ana Silva',
        gender: 'female',
        cpf: VALID_CPF,
        categoryId: CATEGORY_A,
      },
    });

    expect(detail.patient.name).toBe('Ana Silva');
    expect(detail.patient.cpf).toBe(VALID_CPF);
    expect(detail.categoryName).toBe('Particular');
  });

  it('rejects invalid CPF', async () => {
    const { createPatient } = createPatientsTestHarness();

    await expect(
      createPatient.execute({
        storeId: STORE_A,
        input: {
          name: 'João',
          gender: 'male',
          cpf: '12345678901',
          categoryId: CATEGORY_A,
        },
      }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });

  it('rejects duplicate CPF in same store', async () => {
    const { createPatient } = createPatientsTestHarness();

    await createPatient.execute({
      storeId: STORE_A,
      input: {
        name: 'A',
        gender: 'female',
        cpf: VALID_CPF,
        categoryId: CATEGORY_A,
      },
    });

    await expect(
      createPatient.execute({
        storeId: STORE_A,
        input: {
          name: 'B',
          gender: 'male',
          cpf: VALID_CPF,
          categoryId: CATEGORY_A,
        },
      }),
    ).rejects.toBeInstanceOf(PatientCpfTakenError);
  });

  it('allows same CPF in different stores', async () => {
    const harness = createPatientsTestHarness();
    const categoryB = '33333333-3333-4333-8333-333333333333';
    seedCategory(harness.categoryRepo, harness.patientRepo, STORE_B, categoryB);

    await harness.createPatient.execute({
      storeId: STORE_A,
      input: {
        name: 'A',
        gender: 'female',
        cpf: VALID_CPF,
        categoryId: CATEGORY_A,
      },
    });

    const detail = await harness.createPatient.execute({
      storeId: STORE_B,
      input: {
        name: 'B',
        gender: 'male',
        cpf: VALID_CPF,
        categoryId: categoryB,
      },
    });

    expect(detail.patient.cpf).toBe(VALID_CPF);
  });
});
