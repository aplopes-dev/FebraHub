import { UpdatePatientUseCase } from './update-patient.use-case';
import {
  CATEGORY_A,
  STORE_A,
  VALID_CPF,
  createPatientsTestHarness,
} from '../../../tests/patients-test.fixtures';

describe('UpdatePatientUseCase', () => {
  it('updates patient fields', async () => {
    const { patientRepo, validateReferences, createPatient } =
      createPatientsTestHarness();
    const updatePatient = new UpdatePatientUseCase(
      patientRepo,
      validateReferences,
    );

    const created = await createPatient.execute({
      storeId: STORE_A,
      input: { name: 'Ana', gender: 'female', categoryId: CATEGORY_A },
    });

    const updated = await updatePatient.execute({
      storeId: STORE_A,
      id: created.patient.id,
      input: {
        name: 'Ana Silva',
        gender: 'female',
        cpf: VALID_CPF,
        categoryId: CATEGORY_A,
        profession: 'Médica',
      },
    });

    expect(updated.patient.name).toBe('Ana Silva');
    expect(updated.patient.cpf).toBe(VALID_CPF);
    expect(updated.patient.profession).toBe('Médica');
  });
});
