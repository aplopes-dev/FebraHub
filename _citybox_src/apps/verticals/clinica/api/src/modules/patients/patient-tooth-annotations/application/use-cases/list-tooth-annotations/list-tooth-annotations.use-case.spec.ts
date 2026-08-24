import { PatientToothAnnotation } from '../../../domain/entities/patient-tooth-annotation.entity';
import { STORE_A } from '../../../../tests/patients-test.fixtures';
import {
  createPatientToothAnnotationsTestHarness,
  PATIENT_A,
  seedPatient,
} from '../../../tests/patient-tooth-annotations-test.fixtures';

describe('ListPatientToothAnnotationsUseCase', () => {
  it('lists annotations ordered by tooth then createdAt desc', async () => {
    const harness = createPatientToothAnnotationsTestHarness();
    seedPatient(harness);

    await harness.annotationRepo.save(
      PatientToothAnnotation.create(
        {
          storeId: STORE_A,
          patientId: PATIENT_A,
          toothNumber: 21,
          content: 'Primeira',
          professionalName: 'Dr. Ana',
          createdAt: new Date('2026-07-27T10:00:00.000Z'),
        },
        '11111111-1111-4111-8111-111111111111',
      ),
    );
    await harness.annotationRepo.save(
      PatientToothAnnotation.create(
        {
          storeId: STORE_A,
          patientId: PATIENT_A,
          toothNumber: 11,
          content: 'Segunda',
          professionalName: 'Dr. Ana',
          createdAt: new Date('2026-07-27T11:00:00.000Z'),
        },
        '22222222-2222-4222-8222-222222222222',
      ),
    );
    await harness.annotationRepo.save(
      PatientToothAnnotation.create(
        {
          storeId: STORE_A,
          patientId: PATIENT_A,
          toothNumber: 11,
          content: 'Terceira',
          professionalName: 'Dr. Ana',
          createdAt: new Date('2026-07-27T12:00:00.000Z'),
        },
        '33333333-3333-4333-8333-333333333333',
      ),
    );

    const listed = await harness.listToothAnnotations.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
    });

    expect(listed.map((item) => item.content)).toEqual([
      'Terceira',
      'Segunda',
      'Primeira',
    ]);
  });

  it('filters by toothNumber when provided', async () => {
    const harness = createPatientToothAnnotationsTestHarness();
    seedPatient(harness);

    await harness.createToothAnnotation.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      input: {
        toothNumber: 11,
        content: 'Dente 11',
        professionalName: 'Dr. Ana',
      },
    });
    await harness.createToothAnnotation.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      input: {
        toothNumber: 21,
        content: 'Dente 21',
        professionalName: 'Dr. Ana',
      },
    });

    const listed = await harness.listToothAnnotations.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      toothNumber: 21,
    });

    expect(listed).toHaveLength(1);
    expect(listed[0]?.content).toBe('Dente 21');
  });
});
