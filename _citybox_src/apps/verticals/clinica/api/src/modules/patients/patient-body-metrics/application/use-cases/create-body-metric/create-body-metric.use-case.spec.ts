import { ValidatorDomainError } from '../../../../../../shared/core/errors/validator-domain.error';
import { PatientNotFoundError } from '../../../../domain/errors/patient-not-found.error';
import { STORE_A } from '../../../../tests/patients-test.fixtures';
import {
  createPatientBodyMetricsTestHarness,
  PATIENT_A,
  seedPatient,
} from '../../../tests/patient-body-metrics-test.fixtures';

describe('CreatePatientBodyMetricUseCase', () => {
  it('creates body metric with calculated BMI', async () => {
    const harness = createPatientBodyMetricsTestHarness();
    seedPatient(harness);

    const created = await harness.createBodyMetric.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      input: {
        measuredAt: '2026-08-12',
        weightKg: 70,
        heightCm: 175,
        professionalName: 'Dr. Ana',
        notes: 'Primeira medição',
      },
    });

    expect(created.weightKg).toBe(70);
    expect(created.heightCm).toBe(175);
    expect(created.bmi).toBe(22.9);
    expect(created.professionalName).toBe('Dr. Ana');
    expect(created.notes).toBe('Primeira medição');
    expect(created.professionalId).toBe('');
    expect(created.measuredAt.toISOString().slice(0, 10)).toBe('2026-08-12');
    expect(created.createdAt).toBeInstanceOf(Date);
  });

  it('rejects invalid weight or height', async () => {
    const harness = createPatientBodyMetricsTestHarness();
    seedPatient(harness);

    await expect(
      harness.createBodyMetric.execute({
        storeId: STORE_A,
        patientId: PATIENT_A,
        input: {
          measuredAt: '2026-08-12',
          weightKg: 0,
          heightCm: 175,
          professionalName: 'Dr. Ana',
        },
      }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });

  it('rejects when patient does not exist', async () => {
    const harness = createPatientBodyMetricsTestHarness();

    await expect(
      harness.createBodyMetric.execute({
        storeId: STORE_A,
        patientId: PATIENT_A,
        input: {
          measuredAt: '2026-08-12',
          weightKg: 70,
          heightCm: 175,
          professionalName: 'Dr. Ana',
        },
      }),
    ).rejects.toBeInstanceOf(PatientNotFoundError);
  });
});
