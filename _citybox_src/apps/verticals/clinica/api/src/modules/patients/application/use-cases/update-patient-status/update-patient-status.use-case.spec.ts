import { UpdatePatientStatusUseCase } from './update-patient-status.use-case';
import { FindPatientByIdUseCase } from '../find-patient-by-id/find-patient-by-id.use-case';
import {
  CATEGORY_A,
  STORE_A,
  createPatientsTestHarness,
} from '../../../tests/patients-test.fixtures';

describe('UpdatePatientStatusUseCase', () => {
  it('inactivates patient without deleting', async () => {
    const { patientRepo, createPatient } = createPatientsTestHarness();
    const updateStatus = new UpdatePatientStatusUseCase(patientRepo);
    const findPatient = new FindPatientByIdUseCase(patientRepo);

    const created = await createPatient.execute({
      storeId: STORE_A,
      input: { name: 'Inativo', gender: 'female', categoryId: CATEGORY_A },
    });

    const inactive = await updateStatus.execute({
      storeId: STORE_A,
      id: created.patient.id,
      status: 'inactive',
    });

    expect(inactive.patient.status).toBe('inactive');

    const found = await findPatient.execute({
      storeId: STORE_A,
      id: created.patient.id,
    });
    expect(found.patient.status).toBe('inactive');
  });
});
