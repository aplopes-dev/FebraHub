import type { PatientToothAnnotation } from '../entities/patient-tooth-annotation.entity';

export type PatientToothAnnotationListCriteria = {
  toothNumber?: number;
};

export abstract class PatientToothAnnotationRepository {
  abstract findById(
    storeId: string,
    patientId: string,
    annotationId: string,
  ): Promise<PatientToothAnnotation | null>;

  abstract findManyByPatientId(
    storeId: string,
    patientId: string,
    criteria?: PatientToothAnnotationListCriteria,
  ): Promise<PatientToothAnnotation[]>;

  abstract save(
    annotation: PatientToothAnnotation,
  ): Promise<PatientToothAnnotation>;

  abstract delete(
    storeId: string,
    patientId: string,
    annotationId: string,
  ): Promise<void>;
}
