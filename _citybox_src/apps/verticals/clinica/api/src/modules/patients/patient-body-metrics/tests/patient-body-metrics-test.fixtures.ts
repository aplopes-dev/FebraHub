import { InMemoryPatientRepository } from '../../tests/in-memory-patient.repository';
import {
  CATEGORY_A,
  seedMinimalPatient,
  STORE_A,
} from '../../tests/patients-test.fixtures';
import { AssertPatientExistsService } from '../application/services/assert-patient-exists.service';
import { CreatePatientBodyMetricUseCase } from '../application/use-cases/create-body-metric/create-body-metric.use-case';
import { ListPatientBodyMetricsUseCase } from '../application/use-cases/list-body-metrics/list-body-metrics.use-case';
import { InMemoryPatientBodyMetricRepository } from './in-memory-patient-body-metric.repository';

export const PATIENT_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

export type PatientBodyMetricsTestHarness = {
  patientRepo: InMemoryPatientRepository;
  bodyMetricRepo: InMemoryPatientBodyMetricRepository;
  createBodyMetric: CreatePatientBodyMetricUseCase;
  listBodyMetrics: ListPatientBodyMetricsUseCase;
};

export function createPatientBodyMetricsTestHarness(): PatientBodyMetricsTestHarness {
  const patientRepo = new InMemoryPatientRepository();
  const bodyMetricRepo = new InMemoryPatientBodyMetricRepository();
  const assertPatientExists = new AssertPatientExistsService(patientRepo);

  return {
    patientRepo,
    bodyMetricRepo,
    createBodyMetric: new CreatePatientBodyMetricUseCase(
      bodyMetricRepo,
      assertPatientExists,
    ),
    listBodyMetrics: new ListPatientBodyMetricsUseCase(
      bodyMetricRepo,
      assertPatientExists,
    ),
  };
}

export function seedPatient(
  harness: PatientBodyMetricsTestHarness,
  patientId: string = PATIENT_A,
): void {
  seedMinimalPatient(harness.patientRepo, STORE_A, patientId, CATEGORY_A);
}
