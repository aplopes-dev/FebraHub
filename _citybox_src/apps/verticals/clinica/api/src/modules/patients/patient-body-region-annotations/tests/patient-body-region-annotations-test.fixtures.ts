import { InMemoryPatientRepository } from '../../tests/in-memory-patient.repository';
import {
  CATEGORY_A,
  seedMinimalPatient,
  STORE_A,
} from '../../tests/patients-test.fixtures';
import { AssertPatientExistsService } from '../application/services/assert-patient-exists.service';
import { CreatePatientBodyRegionAnnotationUseCase } from '../application/use-cases/create-body-region-annotation/create-body-region-annotation.use-case';
import { DeletePatientBodyRegionAnnotationUseCase } from '../application/use-cases/delete-body-region-annotation/delete-body-region-annotation.use-case';
import { ListPatientBodyRegionAnnotationsUseCase } from '../application/use-cases/list-body-region-annotations/list-body-region-annotations.use-case';
import { InMemoryPatientBodyRegionAnnotationRepository } from './in-memory-patient-body-region-annotation.repository';

export const PATIENT_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

export type PatientBodyRegionAnnotationsTestHarness = {
  patientRepo: InMemoryPatientRepository;
  annotationRepo: InMemoryPatientBodyRegionAnnotationRepository;
  createBodyRegionAnnotation: CreatePatientBodyRegionAnnotationUseCase;
  listBodyRegionAnnotations: ListPatientBodyRegionAnnotationsUseCase;
  deleteBodyRegionAnnotation: DeletePatientBodyRegionAnnotationUseCase;
};

export function createPatientBodyRegionAnnotationsTestHarness(): PatientBodyRegionAnnotationsTestHarness {
  const patientRepo = new InMemoryPatientRepository();
  const annotationRepo = new InMemoryPatientBodyRegionAnnotationRepository();
  const assertPatientExists = new AssertPatientExistsService(patientRepo);

  return {
    patientRepo,
    annotationRepo,
    createBodyRegionAnnotation: new CreatePatientBodyRegionAnnotationUseCase(
      annotationRepo,
      assertPatientExists,
    ),
    listBodyRegionAnnotations: new ListPatientBodyRegionAnnotationsUseCase(
      annotationRepo,
      assertPatientExists,
    ),
    deleteBodyRegionAnnotation: new DeletePatientBodyRegionAnnotationUseCase(
      annotationRepo,
      assertPatientExists,
    ),
  };
}

export function seedPatient(
  harness: PatientBodyRegionAnnotationsTestHarness,
  patientId: string = PATIENT_A,
): void {
  seedMinimalPatient(harness.patientRepo, STORE_A, patientId, CATEGORY_A);
}
