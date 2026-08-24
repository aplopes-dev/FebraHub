import { PatientToothAnnotation } from '../domain/entities/patient-tooth-annotation.entity';
import {
  PatientToothAnnotationRepository,
  type PatientToothAnnotationListCriteria,
} from '../domain/repositories/patient-tooth-annotation.repository.interface';

export class InMemoryPatientToothAnnotationRepository extends PatientToothAnnotationRepository {
  private records: PatientToothAnnotation[] = [];

  findById(
    storeId: string,
    patientId: string,
    annotationId: string,
  ): Promise<PatientToothAnnotation | null> {
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
    criteria: PatientToothAnnotationListCriteria = {},
  ): Promise<PatientToothAnnotation[]> {
    let items = this.records.filter(
      (item) => item.storeId === storeId && item.patientId === patientId,
    );

    if (criteria.toothNumber != null) {
      items = items.filter((item) => item.toothNumber === criteria.toothNumber);
    }

    items = [...items].sort((left, right) => {
      if (left.toothNumber !== right.toothNumber) {
        return left.toothNumber - right.toothNumber;
      }
      return right.createdAt.getTime() - left.createdAt.getTime();
    });

    return Promise.resolve(items.map((item) => this.clone(item)));
  }

  save(annotation: PatientToothAnnotation): Promise<PatientToothAnnotation> {
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

  private clone(annotation: PatientToothAnnotation): PatientToothAnnotation {
    return PatientToothAnnotation.create(
      {
        storeId: annotation.storeId,
        patientId: annotation.patientId,
        toothNumber: annotation.toothNumber,
        content: annotation.content,
        professionalId: annotation.professionalId,
        professionalName: annotation.professionalName,
        createdAt: new Date(annotation.createdAt),
      },
      annotation.id,
    );
  }
}
