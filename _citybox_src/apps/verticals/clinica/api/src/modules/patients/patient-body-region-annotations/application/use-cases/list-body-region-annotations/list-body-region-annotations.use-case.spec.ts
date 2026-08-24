import { PatientBodyRegionAnnotation } from '../../../domain/entities/patient-body-region-annotation.entity';
import { STORE_A } from '../../../../tests/patients-test.fixtures';
import {
  createPatientBodyRegionAnnotationsTestHarness,
  PATIENT_A,
  seedPatient,
} from '../../../tests/patient-body-region-annotations-test.fixtures';

describe('ListPatientBodyRegionAnnotationsUseCase', () => {
  it('lists annotations ordered by region then createdAt desc', async () => {
    const harness = createPatientBodyRegionAnnotationsTestHarness();
    seedPatient(harness);

    await harness.annotationRepo.save(
      PatientBodyRegionAnnotation.create(
        {
          storeId: STORE_A,
          patientId: PATIENT_A,
          bodyRegionId: 'torax',
          content: 'Primeira',
          professionalName: 'Dr. Ana',
          createdAt: new Date('2026-08-12T10:00:00.000Z'),
        },
        '11111111-1111-4111-8111-111111111111',
      ),
    );
    await harness.annotationRepo.save(
      PatientBodyRegionAnnotation.create(
        {
          storeId: STORE_A,
          patientId: PATIENT_A,
          bodyRegionId: 'ombro-direito',
          content: 'Segunda',
          professionalName: 'Dr. Ana',
          createdAt: new Date('2026-08-12T11:00:00.000Z'),
        },
        '22222222-2222-4222-8222-222222222222',
      ),
    );
    await harness.annotationRepo.save(
      PatientBodyRegionAnnotation.create(
        {
          storeId: STORE_A,
          patientId: PATIENT_A,
          bodyRegionId: 'ombro-direito',
          content: 'Terceira',
          professionalName: 'Dr. Ana',
          createdAt: new Date('2026-08-12T12:00:00.000Z'),
        },
        '33333333-3333-4333-8333-333333333333',
      ),
    );

    const listed = await harness.listBodyRegionAnnotations.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
    });

    expect(listed.map((item) => item.content)).toEqual([
      'Terceira',
      'Segunda',
      'Primeira',
    ]);
  });

  it('filters by bodyRegionId when provided', async () => {
    const harness = createPatientBodyRegionAnnotationsTestHarness();
    seedPatient(harness);

    await harness.createBodyRegionAnnotation.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      input: {
        bodyRegionId: 'ombro-direito',
        content: 'Ombro',
        professionalName: 'Dr. Ana',
      },
    });
    await harness.createBodyRegionAnnotation.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      input: {
        bodyRegionId: 'joelho-esquerdo',
        content: 'Joelho',
        professionalName: 'Dr. Ana',
      },
    });

    const listed = await harness.listBodyRegionAnnotations.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      bodyRegionId: 'joelho-esquerdo',
    });

    expect(listed).toHaveLength(1);
    expect(listed[0]?.content).toBe('Joelho');
  });
});
