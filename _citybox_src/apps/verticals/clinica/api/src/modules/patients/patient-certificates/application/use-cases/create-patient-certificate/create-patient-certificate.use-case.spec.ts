import { ValidatorDomainError } from '../../../../../../shared/core/errors/validator-domain.error';
import { ProfessionalCouncilRequiredError } from '../../../../../members/domain/errors/professional-council-required.error';
import { STORE_A } from '../../../../tests/patients-test.fixtures';
import {
  createPatientCertificatesTestHarness,
  PATIENT_A,
  PROFESSIONAL_A,
  SAMPLE_CERTIFICATE_COUNCIL,
  seedPatient,
  seedProfessional,
} from '../../../tests/patient-certificates-test.fixtures';

describe('CreatePatientCertificateUseCase', () => {
  it('creates days certificate with patient name and council snapshot', async () => {
    const harness = createPatientCertificatesTestHarness();
    seedPatient(harness);
    await seedProfessional(harness);

    const created = await harness.createPatientCertificate.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      input: {
        professionalId: PROFESSIONAL_A,
        professionalName: 'Dr. João',
        clinicName: 'Clínica Central',
        type: 'days',
        issuedDate: '2026-07-06',
        daysCount: '3',
        cid: 'A00',
        ...SAMPLE_CERTIFICATE_COUNCIL,
      },
    });

    expect(created.patientName).toBe('Maria');
    expect(created.type).toBe('days');
    expect(created.daysCount).toBe('3');
    expect(created.cid).toBe('A00');
    expect(created.clinicName).toBe('Clínica Central');
    expect(created.startTime).toBeNull();
    expect(created.endTime).toBeNull();
    expect(created.issuedAt).toBeInstanceOf(Date);
    expect(created.councilType).toBe('CRM');
    expect(created.councilNumber).toBe('67890');
    expect(created.councilUf).toBe('SP');
  });

  it('creates attendance certificate with start and end times', async () => {
    const harness = createPatientCertificatesTestHarness();
    seedPatient(harness);
    await seedProfessional(harness);

    const created = await harness.createPatientCertificate.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      input: {
        professionalId: PROFESSIONAL_A,
        professionalName: 'Dr. João',
        type: 'attendance',
        issuedDate: '2026-07-06',
        startTime: '09:00',
        endTime: '11:00',
        ...SAMPLE_CERTIFICATE_COUNCIL,
      },
    });

    expect(created.type).toBe('attendance');
    expect(created.startTime).toBe('09:00');
    expect(created.endTime).toBe('11:00');
    expect(created.daysCount).toBeNull();
  });

  it('rejects days certificate without daysCount', async () => {
    const harness = createPatientCertificatesTestHarness();
    seedPatient(harness);
    await seedProfessional(harness);

    await expect(
      harness.createPatientCertificate.execute({
        storeId: STORE_A,
        patientId: PATIENT_A,
        input: {
          professionalId: PROFESSIONAL_A,
          professionalName: 'Dr. João',
          type: 'days',
          issuedDate: '2026-07-06',
          ...SAMPLE_CERTIFICATE_COUNCIL,
        },
      }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });

  it('rejects attendance certificate without times', async () => {
    const harness = createPatientCertificatesTestHarness();
    seedPatient(harness);
    await seedProfessional(harness);

    await expect(
      harness.createPatientCertificate.execute({
        storeId: STORE_A,
        patientId: PATIENT_A,
        input: {
          professionalId: PROFESSIONAL_A,
          professionalName: 'Dr. João',
          type: 'attendance',
          issuedDate: '2026-07-06',
          ...SAMPLE_CERTIFICATE_COUNCIL,
        },
      }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });

  it('rejects create when council is missing on first emission', async () => {
    const harness = createPatientCertificatesTestHarness();
    seedPatient(harness);
    await seedProfessional(harness);

    await expect(
      harness.createPatientCertificate.execute({
        storeId: STORE_A,
        patientId: PATIENT_A,
        input: {
          professionalId: PROFESSIONAL_A,
          professionalName: 'Dr. João',
          type: 'days',
          issuedDate: '2026-07-06',
          daysCount: '2',
        },
      }),
    ).rejects.toBeInstanceOf(ProfessionalCouncilRequiredError);
  });
});
