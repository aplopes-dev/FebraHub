import { PatientToothAnnotationNotFoundError } from '../../../domain/errors/patient-tooth-annotation-not-found.error';
import { STORE_A } from '../../../../tests/patients-test.fixtures';
import {
  createPatientToothAnnotationsTestHarness,
  PATIENT_A,
  seedPatient,
} from '../../../tests/patient-tooth-annotations-test.fixtures';

describe('DeletePatientToothAnnotationUseCase', () => {
  it('deletes an existing annotation', async () => {
    const harness = createPatientToothAnnotationsTestHarness();
    seedPatient(harness);

    const created = await harness.createToothAnnotation.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      input: {
        toothNumber: 14,
        content: 'Remover',
        professionalName: 'Dr. Ana',
      },
    });

    await harness.deleteToothAnnotation.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      annotationId: created.id,
    });

    const listed = await harness.listToothAnnotations.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
    });

    expect(listed).toHaveLength(0);
  });

  it('rejects when annotation does not exist', async () => {
    const harness = createPatientToothAnnotationsTestHarness();
    seedPatient(harness);

    await expect(
      harness.deleteToothAnnotation.execute({
        storeId: STORE_A,
        patientId: PATIENT_A,
        annotationId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      }),
    ).rejects.toBeInstanceOf(PatientToothAnnotationNotFoundError);
  });
});
