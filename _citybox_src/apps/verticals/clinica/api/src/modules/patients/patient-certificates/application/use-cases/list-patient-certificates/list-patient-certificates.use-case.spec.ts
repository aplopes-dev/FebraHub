import { PatientCertificate } from '../../../domain/entities/patient-certificate.entity';
import { STORE_A } from '../../../../tests/patients-test.fixtures';
import {
  CERTIFICATE_A,
  createPatientCertificatesTestHarness,
  PATIENT_A,
  PROFESSIONAL_A,
  seedPatient,
} from '../../../tests/patient-certificates-test.fixtures';

const CERTIFICATE_B = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

describe('ListPatientCertificatesUseCase', () => {
  it('lists certificates with pagination and default sort by issuedDate desc', async () => {
    const harness = createPatientCertificatesTestHarness();
    seedPatient(harness);

    await harness.certificateRepo.save(
      PatientCertificate.create(
        {
          storeId: STORE_A,
          patientId: PATIENT_A,
          professionalId: PROFESSIONAL_A,
          professionalName: 'Dr. João',
          patientName: 'Maria',
          type: 'days',
          issuedDate: new Date('2026-07-01'),
          issuedAt: new Date('2026-07-01T10:00:00.000Z'),
          daysCount: '3',
        },
        CERTIFICATE_A,
      ),
    );

    await harness.certificateRepo.save(
      PatientCertificate.create(
        {
          storeId: STORE_A,
          patientId: PATIENT_A,
          professionalId: PROFESSIONAL_A,
          professionalName: 'Dr. João',
          patientName: 'Maria',
          type: 'attendance',
          issuedDate: new Date('2026-07-05'),
          issuedAt: new Date('2026-07-05T10:00:00.000Z'),
          startTime: '09:00',
          endTime: '10:00',
        },
        CERTIFICATE_B,
      ),
    );

    const result = await harness.listPatientCertificates.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      page: 1,
      perPage: 10,
    });

    expect(result.total).toBe(2);
    expect(result.items.map((item) => item.id)).toEqual([
      CERTIFICATE_B,
      CERTIFICATE_A,
    ]);
  });

  it('filters by professional name search', async () => {
    const harness = createPatientCertificatesTestHarness();
    seedPatient(harness);

    await harness.certificateRepo.save(
      PatientCertificate.create(
        {
          storeId: STORE_A,
          patientId: PATIENT_A,
          professionalId: PROFESSIONAL_A,
          professionalName: 'Dr. Ana Silva',
          patientName: 'Maria',
          type: 'days',
          issuedDate: new Date('2026-07-01'),
          issuedAt: new Date('2026-07-01T10:00:00.000Z'),
          daysCount: '2',
        },
        CERTIFICATE_A,
      ),
    );

    await harness.certificateRepo.save(
      PatientCertificate.create(
        {
          storeId: STORE_A,
          patientId: PATIENT_A,
          professionalId: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
          professionalName: 'Dr. Carlos',
          patientName: 'Maria',
          type: 'days',
          issuedDate: new Date('2026-07-02'),
          issuedAt: new Date('2026-07-02T10:00:00.000Z'),
          daysCount: '1',
        },
        CERTIFICATE_B,
      ),
    );

    const result = await harness.listPatientCertificates.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      search: 'ana',
    });

    expect(result.total).toBe(1);
    expect(result.items[0]?.professionalName).toBe('Dr. Ana Silva');
  });
});
