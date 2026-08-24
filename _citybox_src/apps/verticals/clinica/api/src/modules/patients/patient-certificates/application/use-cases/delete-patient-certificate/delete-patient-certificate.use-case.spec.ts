import { PatientCertificateNotFoundError } from '../../../domain/errors/patient-certificate-not-found.error';
import { PatientCertificate } from '../../../domain/entities/patient-certificate.entity';
import { STORE_A } from '../../../../tests/patients-test.fixtures';
import {
  CERTIFICATE_A,
  createPatientCertificatesTestHarness,
  PATIENT_A,
  PROFESSIONAL_A,
  seedPatient,
} from '../../../tests/patient-certificates-test.fixtures';

describe('DeletePatientCertificateUseCase', () => {
  it('deletes an existing certificate', async () => {
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
          issuedDate: new Date('2026-07-06'),
          issuedAt: new Date('2026-07-06T10:00:00.000Z'),
          daysCount: '2',
        },
        CERTIFICATE_A,
      ),
    );

    await harness.deletePatientCertificate.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      certificateId: CERTIFICATE_A,
    });

    expect(harness.certificateRepo.getAll()).toHaveLength(0);
  });

  it('throws when certificate does not exist', async () => {
    const harness = createPatientCertificatesTestHarness();
    seedPatient(harness);

    await expect(
      harness.deletePatientCertificate.execute({
        storeId: STORE_A,
        patientId: PATIENT_A,
        certificateId: CERTIFICATE_A,
      }),
    ).rejects.toBeInstanceOf(PatientCertificateNotFoundError);
  });
});
