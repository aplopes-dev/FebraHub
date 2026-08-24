import { PatientAnamnesisAlreadySubmittedError } from '../../../domain/errors/patient-anamnesis-already-submitted.error';
import { PatientAnamnesisLinkExpiredError } from '../../../domain/errors/patient-anamnesis-link-expired.error';
import {
  createPatientAnamnesesTestHarness,
  seedAwaitingAnamnesis,
  seedPatient,
} from '../../../tests/patient-anamneses-test.fixtures';

describe('SubmitPublicAnamnesisUseCase', () => {
  it('submits public answers and marks anamnesis as issued', async () => {
    const harness = createPatientAnamnesesTestHarness();
    seedPatient(harness);
    seedAwaitingAnamnesis(harness, { publicToken: 'token-submit' });

    const updated = await harness.submitPublicAnamnesis.execute({
      publicToken: 'token-submit',
      answers: [
        { questionId: 'consultation-reason', text: 'Consulta de rotina' },
        { questionId: 'custom-text-1', text: 'Nenhuma alergia' },
      ],
    });

    expect(updated.status).toBe('issued');
    expect(updated.consultationReason).toBe('Consulta de rotina');
    expect(updated.answers).toHaveLength(2);
  });

  it('rejects expired link', async () => {
    const harness = createPatientAnamnesesTestHarness();
    seedPatient(harness);
    seedAwaitingAnamnesis(harness, {
      publicToken: 'token-expired',
      linkExpiresAt: new Date('2020-01-01'),
    });

    await expect(
      harness.submitPublicAnamnesis.execute({
        publicToken: 'token-expired',
        answers: [
          { questionId: 'consultation-reason', text: 'Motivo' },
          { questionId: 'custom-text-1', text: 'Nada' },
        ],
      }),
    ).rejects.toBeInstanceOf(PatientAnamnesisLinkExpiredError);
  });

  it('rejects already submitted anamnesis', async () => {
    const harness = createPatientAnamnesesTestHarness();
    seedPatient(harness);
    const anamnesis = seedAwaitingAnamnesis(harness, {
      publicToken: 'token-done',
    });
    await harness.submitPublicAnamnesis.execute({
      publicToken: 'token-done',
      answers: [
        { questionId: 'consultation-reason', text: 'Motivo' },
        { questionId: 'custom-text-1', text: 'Nada' },
      ],
    });

    await expect(
      harness.submitPublicAnamnesis.execute({
        publicToken: anamnesis.publicToken!,
        answers: [
          { questionId: 'consultation-reason', text: 'Outro' },
          { questionId: 'custom-text-1', text: 'Nada' },
        ],
      }),
    ).rejects.toBeInstanceOf(PatientAnamnesisAlreadySubmittedError);
  });
});
