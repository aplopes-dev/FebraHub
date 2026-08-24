import type { PatientBodyRegionAnnotation } from '../entities/patient-body-region-annotation.entity';

export type PatientBodyRegionAnnotationListCriteria = {
  bodyRegionId?: string;
};

export abstract class PatientBodyRegionAnnotationRepository {
  abstract findById(
    storeId: string,
    patientId: string,
    annotationId: string,
  ): Promise<PatientBodyRegionAnnotation | null>;

  abstract findManyByPatientId(
    storeId: string,
    patientId: string,
    criteria?: PatientBodyRegionAnnotationListCriteria,
  ): Promise<PatientBodyRegionAnnotation[]>;

  abstract save(
    annotation: PatientBodyRegionAnnotation,
  ): Promise<PatientBodyRegionAnnotation>;

  abstract delete(
    storeId: string,
    patientId: string,
    annotationId: string,
  ): Promise<void>;
}
