import { ValidatorDomainError } from '../../../../../../shared/core/errors/validator-domain.error';
import { GLOBAL_QUESTION_1 } from '../../../../../anamnesis/tests/fixtures';
import { STORE_A } from '../../../../tests/patients-test.fixtures';
import {
  createPatientAnamnesesTestHarness,
  PATIENT_A,
  seedActiveTemplate,
  seedPatient,
  TEMPLATE_A,
} from '../../../tests/patient-anamneses-test.fixtures';

describe('CreatePatientAnamnesisUseCase', () => {
  it('creates professional anamnesis with answers', async () => {
    const harness = createPatientAnamnesesTestHarness();
    seedPatient(harness);
    await seedActiveTemplate(harness);

    const created = await harness.createPatientAnamnesis.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      input: {
        templateId: TEMPLATE_A,
        fillingMode: 'professional',
        consultationReason: 'Dor de dente',
        answers: [
          { questionId: GLOBAL_QUESTION_1.id, triState: 'unknown' },
          { questionId: 'custom-text-1', text: 'Nenhuma' },
        ],
      },
    });

    expect(created.status).toBe('issued');
    expect(created.fillingMode).toBe('professional');
    expect(created.publicToken).toBeNull();
    expect(created.answers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          questionId: 'consultation-reason',
          text: 'Dor de dente',
        }),
        expect.objectContaining({
          questionId: GLOBAL_QUESTION_1.id,
          triState: 'unknown',
        }),
      ]),
    );
  });

  it('creates patient-filling anamnesis with public token and expiry', async () => {
    const harness = createPatientAnamnesesTestHarness();
    seedPatient(harness);
    await seedActiveTemplate(harness);

    const created = await harness.createPatientAnamnesis.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      input: {
        templateId: TEMPLATE_A,
        fillingMode: 'patient',
      },
    });

    expect(created.status).toBe('awaiting_response');
    expect(created.answers).toBeNull();
    expect(created.publicToken).toBeTruthy();
    expect(created.linkExpiresAt).toBeTruthy();
    expect(created.questionsSnapshot.length).toBeGreaterThan(0);
  });

  it('rejects inactive template', async () => {
    const harness = createPatientAnamnesesTestHarness();
    seedPatient(harness);
    await seedActiveTemplate(harness);
    await harness.templateRepo.updateStatus(STORE_A, TEMPLATE_A, 'inactive');

    await expect(
      harness.createPatientAnamnesis.execute({
        storeId: STORE_A,
        patientId: PATIENT_A,
        input: {
          templateId: TEMPLATE_A,
          fillingMode: 'patient',
        },
      }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });
});
