import { PatientAnamnesisNotFoundError } from '../../../domain/errors/patient-anamnesis-not-found.error';
import {
  createPatientAnamnesesTestHarness,
  seedAwaitingAnamnesis,
  seedPatient,
} from '../../../tests/patient-anamneses-test.fixtures';

describe('FindPublicAnamnesisByTokenUseCase', () => {
  it('returns public payload with patient name', async () => {
    const harness = createPatientAnamnesesTestHarness();
    seedPatient(harness);
    seedAwaitingAnamnesis(harness, { publicToken: 'token-abc' });

    const result = await harness.findPublicAnamnesisByToken.execute({
      publicToken: 'token-abc',
    });

    expect(result.patientName).toBe('Maria');
    expect(result.clinicDisplayName).toBe('Clínica');
    expect(result.anamnesis.status).toBe('awaiting_response');
    expect(result.anamnesis.storeId).toBeTruthy();
  });

  it('throws not found for invalid token', async () => {
    const harness = createPatientAnamnesesTestHarness();

    await expect(
      harness.findPublicAnamnesisByToken.execute({ publicToken: 'missing' }),
    ).rejects.toBeInstanceOf(PatientAnamnesisNotFoundError);
  });
});
