import { ValidatorDomainError } from '../../../../../../shared/core/errors/validator-domain.error';
import { PatientNotFoundError } from '../../../../domain/errors/patient-not-found.error';
import { STORE_A } from '../../../../tests/patients-test.fixtures';
import {
  createPatientToothAnnotationsTestHarness,
  PATIENT_A,
  seedPatient,
} from '../../../tests/patient-tooth-annotations-test.fixtures';

describe('CreatePatientToothAnnotationUseCase', () => {
  it('creates annotation for a valid FDI tooth', async () => {
    const harness = createPatientToothAnnotationsTestHarness();
    seedPatient(harness);

    const created = await harness.createToothAnnotation.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      input: {
        toothNumber: 16,
        content: 'Cárie oclusal',
        professionalName: 'Dr. Ana',
      },
    });

    expect(created.toothNumber).toBe(16);
    expect(created.content).toBe('Cárie oclusal');
    expect(created.professionalName).toBe('Dr. Ana');
    expect(created.professionalId).toBe('');
    expect(created.createdAt).toBeInstanceOf(Date);
  });

  it('rejects invalid FDI tooth number', async () => {
    const harness = createPatientToothAnnotationsTestHarness();
    seedPatient(harness);

    await expect(
      harness.createToothAnnotation.execute({
        storeId: STORE_A,
        patientId: PATIENT_A,
        input: {
          toothNumber: 99,
          content: 'Inválido',
          professionalName: 'Dr. Ana',
        },
      }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });

  it('rejects empty content', async () => {
    const harness = createPatientToothAnnotationsTestHarness();
    seedPatient(harness);

    await expect(
      harness.createToothAnnotation.execute({
        storeId: STORE_A,
        patientId: PATIENT_A,
        input: {
          toothNumber: 11,
          content: '   ',
          professionalName: 'Dr. Ana',
        },
      }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });

  it('rejects when patient does not exist', async () => {
    const harness = createPatientToothAnnotationsTestHarness();

    await expect(
      harness.createToothAnnotation.execute({
        storeId: STORE_A,
        patientId: PATIENT_A,
        input: {
          toothNumber: 11,
          content: 'Nota',
          professionalName: 'Dr. Ana',
        },
      }),
    ).rejects.toBeInstanceOf(PatientNotFoundError);
  });
});
