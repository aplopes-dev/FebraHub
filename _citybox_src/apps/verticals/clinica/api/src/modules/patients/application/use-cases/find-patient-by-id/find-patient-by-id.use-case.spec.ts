import { FindPatientByIdUseCase } from './find-patient-by-id.use-case';
import { PatientNotFoundError } from '../../../domain/errors/patient-not-found.error';
import {
  CATEGORY_A,
  STORE_A,
  STORE_B,
  VALID_CPF_2,
  createPatientsTestHarness,
} from '../../../tests/patients-test.fixtures';

describe('FindPatientByIdUseCase', () => {
  it('returns patient detail for the same store', async () => {
    const { patientRepo, createPatient } = createPatientsTestHarness();
    const findPatient = new FindPatientByIdUseCase(patientRepo);

    const created = await createPatient.execute({
      storeId: STORE_A,
      input: {
        name: 'Paciente A',
        gender: 'female',
        cpf: VALID_CPF_2,
        categoryId: CATEGORY_A,
      },
    });

    const detail = await findPatient.execute({
      storeId: STORE_A,
      id: created.patient.id,
    });

    expect(detail.patient.id).toBe(created.patient.id);
    expect(detail.patient.name).toBe('Paciente A');
  });

  it('blocks cross-store access (IDOR)', async () => {
    const { patientRepo, createPatient } = createPatientsTestHarness();
    const findPatient = new FindPatientByIdUseCase(patientRepo);

    const created = await createPatient.execute({
      storeId: STORE_A,
      input: {
        name: 'Paciente A',
        gender: 'female',
        cpf: VALID_CPF_2,
        categoryId: CATEGORY_A,
      },
    });

    await expect(
      findPatient.execute({ storeId: STORE_B, id: created.patient.id }),
    ).rejects.toBeInstanceOf(PatientNotFoundError);
  });
});
