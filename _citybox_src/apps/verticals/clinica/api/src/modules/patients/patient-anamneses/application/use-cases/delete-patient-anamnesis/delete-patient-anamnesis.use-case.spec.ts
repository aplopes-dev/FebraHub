import { PatientAnamnesisNotFoundError } from '../../../domain/errors/patient-anamnesis-not-found.error';
import {
  STORE_A,
  seedMinimalPatient,
} from '../../../../tests/patients-test.fixtures';
import {
  ANAMNESIS_A,
  createPatientAnamnesesTestHarness,
  PATIENT_A,
  seedAwaitingAnamnesis,
  seedPatient,
} from '../../../tests/patient-anamneses-test.fixtures';

const OTHER_PATIENT = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

describe('DeletePatientAnamnesisUseCase', () => {
  it('deletes anamnesis for the patient store scope', async () => {
    const harness = createPatientAnamnesesTestHarness();
    seedPatient(harness);
    seedAwaitingAnamnesis(harness);

    await harness.deletePatientAnamnesis.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      anamnesisId: ANAMNESIS_A,
    });

    expect(harness.anamnesisRepo.getAll()).toHaveLength(0);
  });

  it('throws not found when anamnesis belongs to another patient (anti-IDOR)', async () => {
    const harness = createPatientAnamnesesTestHarness();
    seedPatient(harness);
    seedMinimalPatientForDeleteTest(harness);
    seedAwaitingAnamnesis(harness);

    await expect(
      harness.deletePatientAnamnesis.execute({
        storeId: STORE_A,
        patientId: OTHER_PATIENT,
        anamnesisId: ANAMNESIS_A,
      }),
    ).rejects.toBeInstanceOf(PatientAnamnesisNotFoundError);
  });
});

function seedMinimalPatientForDeleteTest(
  harness: ReturnType<typeof createPatientAnamnesesTestHarness>,
): void {
  seedMinimalPatient(harness.patientRepo, STORE_A, OTHER_PATIENT);
  harness.anamnesisRepo.seedPatientName(STORE_A, OTHER_PATIENT, 'Outro');
}
