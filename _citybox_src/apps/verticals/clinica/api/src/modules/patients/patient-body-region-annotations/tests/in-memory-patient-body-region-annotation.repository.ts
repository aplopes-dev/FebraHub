import { PatientBodyRegionAnnotation } from '../domain/entities/patient-body-region-annotation.entity';
import {
  PatientBodyRegionAnnotationRepository,
  type PatientBodyRegionAnnotationListCriteria,
} from '../domain/repositories/patient-body-region-annotation.repository.interface';

export class InMemoryPatientBodyRegionAnnotationRepository extends PatientBodyRegionAnnotationRepository {
  private records: PatientBodyRegionAnnotation[] = [];

  findById(
    storeId: string,
    patientId: string,
    annotationId: string,
  ): Promise<PatientBodyRegionAnnotation | null> {
    const record = this.records.find(
      (item) =>
        item.id === annotationId &&
        item.storeId === storeId &&
        item.patientId === patientId,
    );
    return Promise.resolve(record ? this.clone(record) : null);
  }

  findManyByPatientId(
    storeId: string,
    patientId: string,
    criteria: PatientBodyRegionAnnotationListCriteria = {},
  ): Promise<PatientBodyRegionAnnotation[]> {
    let items = this.records.filter(
      (item) => item.storeId === storeId && item.patientId === patientId,
    );

    if (criteria.bodyRegionId != null) {
      items = items.filter(
        (item) => item.bodyRegionId === criteria.bodyRegionId,
      );
    }

    items = [...items].sort((left, right) => {
      if (left.bodyRegionId !== right.bodyRegionId) {
        return left.bodyRegionId.localeCompare(right.bodyRegionId);
      }
      return right.createdAt.getTime() - left.createdAt.getTime();
    });

    return Promise.resolve(items.map((item) => this.clone(item)));
  }

  save(
    annotation: PatientBodyRegionAnnotation,
  ): Promise<PatientBodyRegionAnnotation> {
    const index = this.records.findIndex((item) => item.id === annotation.id);
    const saved = this.clone(annotation);
    if (index >= 0) {
      this.records[index] = saved;
    } else {
      this.records.push(saved);
    }
    return Promise.resolve(this.clone(saved));
  }

  delete(
    storeId: string,
    patientId: string,
    annotationId: string,
  ): Promise<void> {
    this.records = this.records.filter(
      (item) =>
        !(
          item.id === annotationId &&
          item.storeId === storeId &&
          item.patientId === patientId
        ),
    );
    return Promise.resolve();
  }

  clear(): void {
    this.records = [];
  }

  private clone(
    annotation: PatientBodyRegionAnnotation,
  ): PatientBodyRegionAnnotation {
    return PatientBodyRegionAnnotation.create(
      {
        storeId: annotation.storeId,
        patientId: annotation.patientId,
        bodyRegionId: annotation.bodyRegionId,
        content: annotation.content,
        professionalId: annotation.professionalId,
        professionalName: annotation.professionalName,
        createdAt: new Date(annotation.createdAt),
      },
      annotation.id,
    );
  }
}
