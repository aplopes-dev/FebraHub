import { InMemoryPatientRepository } from '../../tests/in-memory-patient.repository';
import {
  CATEGORY_A,
  seedMinimalPatient,
  STORE_A,
} from '../../tests/patients-test.fixtures';
import { AssertPatientExistsService } from '../application/services/assert-patient-exists.service';
import { CreatePatientToothAnnotationUseCase } from '../application/use-cases/create-tooth-annotation/create-tooth-annotation.use-case';
import { DeletePatientToothAnnotationUseCase } from '../application/use-cases/delete-tooth-annotation/delete-tooth-annotation.use-case';
import { ListPatientToothAnnotationsUseCase } from '../application/use-cases/list-tooth-annotations/list-tooth-annotations.use-case';
import { InMemoryPatientToothAnnotationRepository } from './in-memory-patient-tooth-annotation.repository';

export const PATIENT_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

export type PatientToothAnnotationsTestHarness = {
  patientRepo: InMemoryPatientRepository;
  annotationRepo: InMemoryPatientToothAnnotationRepository;
  createToothAnnotation: CreatePatientToothAnnotationUseCase;
  listToothAnnotations: ListPatientToothAnnotationsUseCase;
  deleteToothAnnotation: DeletePatientToothAnnotationUseCase;
};

export function createPatientToothAnnotationsTestHarness(): PatientToothAnnotationsTestHarness {
  const patientRepo = new InMemoryPatientRepository();
  const annotationRepo = new InMemoryPatientToothAnnotationRepository();
  const assertPatientExists = new AssertPatientExistsService(patientRepo);

  return {
    patientRepo,
    annotationRepo,
    createToothAnnotation: new CreatePatientToothAnnotationUseCase(
      annotationRepo,
      assertPatientExists,
    ),
    listToothAnnotations: new ListPatientToothAnnotationsUseCase(
      annotationRepo,
      assertPatientExists,
    ),
    deleteToothAnnotation: new DeletePatientToothAnnotationUseCase(
      annotationRepo,
      assertPatientExists,
    ),
  };
}

export function seedPatient(
  harness: PatientToothAnnotationsTestHarness,
  patientId: string = PATIENT_A,
): void {
  seedMinimalPatient(harness.patientRepo, STORE_A, patientId, CATEGORY_A);
}
