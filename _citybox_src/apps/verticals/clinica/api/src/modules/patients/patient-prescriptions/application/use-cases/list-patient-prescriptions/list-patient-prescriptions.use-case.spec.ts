import { PatientPrescription } from '../../../domain/entities/patient-prescription.entity';
import { STORE_A } from '../../../../tests/patients-test.fixtures';
import {
  createPatientPrescriptionsTestHarness,
  PATIENT_A,
  PRESCRIPTION_A,
  seedPatient,
} from '../../../tests/patient-prescriptions-test.fixtures';

describe('ListPatientPrescriptionsUseCase', () => {
  it('lists prescriptions sorted by issuedDate desc by default', async () => {
    const harness = createPatientPrescriptionsTestHarness();
    seedPatient(harness);

    await harness.prescriptionRepo.save(
      PatientPrescription.create(
        {
          storeId: STORE_A,
          patientId: PATIENT_A,
          professionalId: 'p1',
          professionalName: 'Dr. A',
          patientName: 'Maria',
          clinicName: null,
          issuedDate: new Date('2026-07-01'),
          issuedAt: new Date('2026-07-01T10:00:00.000Z'),
          items: [],
        },
        'rx-1',
      ),
    );

    await harness.prescriptionRepo.save(
      PatientPrescription.create(
        {
          storeId: STORE_A,
          patientId: PATIENT_A,
          professionalId: 'p2',
          professionalName: 'Dr. B',
          patientName: 'Maria',
          clinicName: null,
          issuedDate: new Date('2026-07-05'),
          issuedAt: new Date('2026-07-05T10:00:00.000Z'),
          items: [],
        },
        PRESCRIPTION_A,
      ),
    );

    const result = await harness.listPatientPrescriptions.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      page: 1,
      perPage: 10,
    });

    expect(result.total).toBe(2);
    expect(result.items.map((item) => item.id)).toEqual([
      PRESCRIPTION_A,
      'rx-1',
    ]);
  });
});
