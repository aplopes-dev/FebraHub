import { PatientBodyMetric } from '../domain/entities/patient-body-metric.entity';
import {
  PatientBodyMetricRepository,
  type PatientBodyMetricListCriteria,
} from '../domain/repositories/patient-body-metric.repository.interface';

export class InMemoryPatientBodyMetricRepository extends PatientBodyMetricRepository {
  private records: PatientBodyMetric[] = [];

  findManyByPatientId(
    storeId: string,
    patientId: string,
    criteria: PatientBodyMetricListCriteria,
  ): Promise<PatientBodyMetric[]> {
    let items = this.records.filter(
      (item) => item.storeId === storeId && item.patientId === patientId,
    );

    const sortOrder = criteria.sortOrder ?? 'desc';
    items = [...items].sort((left, right) => {
      const diff = left.measuredAt.getTime() - right.measuredAt.getTime();
      return sortOrder === 'asc' ? diff : -diff;
    });

    const pageItems = items.slice(
      criteria.skip,
      criteria.skip + criteria.take,
    );

    return Promise.resolve(pageItems.map((item) => this.clone(item)));
  }

  countByPatientId(
    storeId: string,
    patientId: string,
    _criteria: Omit<PatientBodyMetricListCriteria, 'skip' | 'take'>,
  ): Promise<number> {
    const total = this.records.filter(
      (item) => item.storeId === storeId && item.patientId === patientId,
    ).length;
    return Promise.resolve(total);
  }

  save(metric: PatientBodyMetric): Promise<PatientBodyMetric> {
    const saved = this.clone(metric);
    this.records.push(saved);
    return Promise.resolve(this.clone(saved));
  }

  clear(): void {
    this.records = [];
  }

  private clone(metric: PatientBodyMetric): PatientBodyMetric {
    return PatientBodyMetric.create(
      {
        storeId: metric.storeId,
        patientId: metric.patientId,
        measuredAt: new Date(metric.measuredAt),
        weightKg: metric.weightKg,
        heightCm: metric.heightCm,
        bmi: metric.bmi,
        professionalId: metric.professionalId,
        professionalName: metric.professionalName,
        notes: metric.notes,
        createdAt: new Date(metric.createdAt),
        updatedAt: new Date(metric.updatedAt),
      },
      metric.id,
    );
  }
}
