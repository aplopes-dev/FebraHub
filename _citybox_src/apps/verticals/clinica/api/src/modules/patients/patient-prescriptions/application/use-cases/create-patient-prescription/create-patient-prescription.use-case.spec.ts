import { ProfessionalCouncilRequiredError } from '../../../../../members/domain/errors/professional-council-required.error';
import { STORE_A } from '../../../../tests/patients-test.fixtures';
import {
  createPatientPrescriptionsTestHarness,
  PATIENT_A,
  PROFESSIONAL_A,
  SAMPLE_PRESCRIPTION_INPUT,
  seedPatient,
  seedProfessional,
} from '../../../tests/patient-prescriptions-test.fixtures';

describe('CreatePatientPrescriptionUseCase', () => {
  it('creates a prescription with denormalized patient name and council snapshot', async () => {
    const harness = createPatientPrescriptionsTestHarness();
    seedPatient(harness);
    await seedProfessional(harness);

    const result = await harness.createPatientPrescription.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      input: SAMPLE_PRESCRIPTION_INPUT,
    });

    expect(result.patientName).toBe('Maria');
    expect(result.professionalName).toBe('Dr. João');
    expect(result.items).toHaveLength(1);
    expect(result.councilType).toBe('CRO');
    expect(result.councilNumber).toBe('12345');
    expect(result.councilUf).toBe('BA');

    const member = await harness.memberRepo.findById(PROFESSIONAL_A);
    expect(member?.councilType).toBe('CRO');
    expect(member?.councilNumber).toBe('12345');
    expect(member?.councilUf).toBe('BA');
  });

  it('does not overwrite member council on second emission', async () => {
    const harness = createPatientPrescriptionsTestHarness();
    seedPatient(harness);
    await seedProfessional(harness);

    await harness.createPatientPrescription.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      input: SAMPLE_PRESCRIPTION_INPUT,
    });

    const second = await harness.createPatientPrescription.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      input: {
        ...SAMPLE_PRESCRIPTION_INPUT,
        councilType: 'CRM',
        councilNumber: '99999',
        councilUf: 'SP',
      },
    });

    expect(second.councilType).toBe('CRO');
    expect(second.councilNumber).toBe('12345');
    expect(second.councilUf).toBe('BA');
  });

  it('rejects create when council is missing on first emission', async () => {
    const harness = createPatientPrescriptionsTestHarness();
    seedPatient(harness);
    await seedProfessional(harness);

    await expect(
      harness.createPatientPrescription.execute({
        storeId: STORE_A,
        patientId: PATIENT_A,
        input: {
          professionalId: PROFESSIONAL_A,
          professionalName: 'Dr. João',
          issuedDate: '2026-07-06',
          items: SAMPLE_PRESCRIPTION_INPUT.items,
        },
      }),
    ).rejects.toBeInstanceOf(ProfessionalCouncilRequiredError);
  });
});
