import type { PatientBodyMetric } from '../entities/patient-body-metric.entity';

export type PatientBodyMetricListSortBy = 'measuredAt';

export type PatientBodyMetricListCriteria = {
  skip: number;
  take: number;
  sortBy?: PatientBodyMetricListSortBy;
  sortOrder?: 'asc' | 'desc';
};

export abstract class PatientBodyMetricRepository {
  abstract findManyByPatientId(
    storeId: string,
    patientId: string,
    criteria: PatientBodyMetricListCriteria,
  ): Promise<PatientBodyMetric[]>;

  abstract countByPatientId(
    storeId: string,
    patientId: string,
    criteria: Omit<PatientBodyMetricListCriteria, 'skip' | 'take'>,
  ): Promise<number>;

  abstract save(metric: PatientBodyMetric): Promise<PatientBodyMetric>;
}
