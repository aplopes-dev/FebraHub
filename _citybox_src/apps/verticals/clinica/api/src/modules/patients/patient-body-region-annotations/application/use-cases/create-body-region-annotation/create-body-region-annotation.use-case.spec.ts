import { ValidatorDomainError } from '../../../../../../shared/core/errors/validator-domain.error';
import { PatientNotFoundError } from '../../../../domain/errors/patient-not-found.error';
import { STORE_A } from '../../../../tests/patients-test.fixtures';
import {
  createPatientBodyRegionAnnotationsTestHarness,
  PATIENT_A,
  seedPatient,
} from '../../../tests/patient-body-region-annotations-test.fixtures';

describe('CreatePatientBodyRegionAnnotationUseCase', () => {
  it('creates annotation for a valid body region', async () => {
    const harness = createPatientBodyRegionAnnotationsTestHarness();
    seedPatient(harness);

    const created = await harness.createBodyRegionAnnotation.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      input: {
        bodyRegionId: 'ombro-direito',
        content: 'Dor ao elevação',
        professionalName: 'Dr. Ana',
      },
    });

    expect(created.bodyRegionId).toBe('ombro-direito');
    expect(created.content).toBe('Dor ao elevação');
    expect(created.professionalName).toBe('Dr. Ana');
    expect(created.professionalId).toBe('');
    expect(created.createdAt).toBeInstanceOf(Date);
  });

  it('rejects invalid body region id', async () => {
    const harness = createPatientBodyRegionAnnotationsTestHarness();
    seedPatient(harness);

    await expect(
      harness.createBodyRegionAnnotation.execute({
        storeId: STORE_A,
        patientId: PATIENT_A,
        input: {
          bodyRegionId: 'regiao-inexistente',
          content: 'Inválido',
          professionalName: 'Dr. Ana',
        },
      }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });

  it('rejects empty content', async () => {
    const harness = createPatientBodyRegionAnnotationsTestHarness();
    seedPatient(harness);

    await expect(
      harness.createBodyRegionAnnotation.execute({
        storeId: STORE_A,
        patientId: PATIENT_A,
        input: {
          bodyRegionId: 'ombro-direito',
          content: '   ',
          professionalName: 'Dr. Ana',
        },
      }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });

  it('rejects when patient does not exist', async () => {
    const harness = createPatientBodyRegionAnnotationsTestHarness();

    await expect(
      harness.createBodyRegionAnnotation.execute({
        storeId: STORE_A,
        patientId: PATIENT_A,
        input: {
          bodyRegionId: 'ombro-direito',
          content: 'Nota',
          professionalName: 'Dr. Ana',
        },
      }),
    ).rejects.toBeInstanceOf(PatientNotFoundError);
  });
});
