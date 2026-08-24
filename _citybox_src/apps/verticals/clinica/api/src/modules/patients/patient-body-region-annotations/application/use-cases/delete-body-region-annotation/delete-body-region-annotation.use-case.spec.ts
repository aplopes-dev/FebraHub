import { PatientBodyRegionAnnotationNotFoundError } from '../../../domain/errors/patient-body-region-annotation-not-found.error';
import { STORE_A } from '../../../../tests/patients-test.fixtures';
import {
  createPatientBodyRegionAnnotationsTestHarness,
  PATIENT_A,
  seedPatient,
} from '../../../tests/patient-body-region-annotations-test.fixtures';

describe('DeletePatientBodyRegionAnnotationUseCase', () => {
  it('deletes an existing annotation', async () => {
    const harness = createPatientBodyRegionAnnotationsTestHarness();
    seedPatient(harness);

    const created = await harness.createBodyRegionAnnotation.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      input: {
        bodyRegionId: 'coluna-lombar',
        content: 'Remover',
        professionalName: 'Dr. Ana',
      },
    });

    await harness.deleteBodyRegionAnnotation.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      annotationId: created.id,
    });

    const listed = await harness.listBodyRegionAnnotations.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
    });

    expect(listed).toHaveLength(0);
  });

  it('rejects when annotation does not exist', async () => {
    const harness = createPatientBodyRegionAnnotationsTestHarness();
    seedPatient(harness);

    await expect(
      harness.deleteBodyRegionAnnotation.execute({
        storeId: STORE_A,
        patientId: PATIENT_A,
        annotationId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      }),
    ).rejects.toBeInstanceOf(PatientBodyRegionAnnotationNotFoundError);
  });
});
