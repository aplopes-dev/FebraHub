import { AssertPatientExistsService } from '../application/services/assert-patient-exists.service';
import { AssertPatientFolderExistsService } from '../application/services/assert-patient-folder-exists.service';
import { CreatePatientFolderUseCase } from '../application/use-cases/create-patient-folder/create-patient-folder.use-case';
import { DeletePatientFileUseCase } from '../application/use-cases/delete-patient-file/delete-patient-file.use-case';
import { DeletePatientFolderUseCase } from '../application/use-cases/delete-patient-folder/delete-patient-folder.use-case';
import { GetPatientDriveBreadcrumbUseCase } from '../application/use-cases/get-patient-drive-breadcrumb/get-patient-drive-breadcrumb.use-case';
import { GetPatientFileContentUseCase } from '../application/use-cases/get-patient-file-content/get-patient-file-content.use-case';
import { ListPatientDriveUseCase } from '../application/use-cases/list-patient-drive/list-patient-drive.use-case';
import { ListPatientMoveDestinationsUseCase } from '../application/use-cases/list-patient-move-destinations/list-patient-move-destinations.use-case';
import { MovePatientFileUseCase } from '../application/use-cases/move-patient-file/move-patient-file.use-case';
import { MovePatientFolderUseCase } from '../application/use-cases/move-patient-folder/move-patient-folder.use-case';
import { RenamePatientFileUseCase } from '../application/use-cases/rename-patient-file/rename-patient-file.use-case';
import { RenamePatientFolderUseCase } from '../application/use-cases/rename-patient-folder/rename-patient-folder.use-case';
import { UploadPatientFileUseCase } from '../application/use-cases/upload-patient-file/upload-patient-file.use-case';
import { InMemoryPatientFileRepository } from './in-memory-patient-file.repository';
import { InMemoryPatientRepository } from '../../tests/in-memory-patient.repository';
import {
  seedMinimalPatient,
  STORE_A,
} from '../../tests/patients-test.fixtures';
import { InMemoryObjectStorage } from '../../../../shared/infra/storage/in-memory-object-storage';

export const PATIENT_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

export type PatientFilesTestHarness = {
  fileRepo: InMemoryPatientFileRepository;
  patientRepo: InMemoryPatientRepository;
  storage: InMemoryObjectStorage;
  assertPatientExists: AssertPatientExistsService;
  assertFolderExists: AssertPatientFolderExistsService;
  listPatientDrive: ListPatientDriveUseCase;
  getPatientDriveBreadcrumb: GetPatientDriveBreadcrumbUseCase;
  listPatientMoveDestinations: ListPatientMoveDestinationsUseCase;
  createPatientFolder: CreatePatientFolderUseCase;
  renamePatientFolder: RenamePatientFolderUseCase;
  movePatientFolder: MovePatientFolderUseCase;
  deletePatientFolder: DeletePatientFolderUseCase;
  uploadPatientFile: UploadPatientFileUseCase;
  getPatientFileContent: GetPatientFileContentUseCase;
  renamePatientFile: RenamePatientFileUseCase;
  movePatientFile: MovePatientFileUseCase;
  deletePatientFile: DeletePatientFileUseCase;
};

export function createPatientFilesTestHarness(): PatientFilesTestHarness {
  const fileRepo = new InMemoryPatientFileRepository();
  const patientRepo = new InMemoryPatientRepository();
  const storage = new InMemoryObjectStorage();
  const assertPatientExists = new AssertPatientExistsService(patientRepo);
  const assertFolderExists = new AssertPatientFolderExistsService(fileRepo);

  return {
    fileRepo,
    patientRepo,
    storage,
    assertPatientExists,
    assertFolderExists,
    listPatientDrive: new ListPatientDriveUseCase(
      fileRepo,
      assertPatientExists,
      assertFolderExists,
    ),
    getPatientDriveBreadcrumb: new GetPatientDriveBreadcrumbUseCase(
      fileRepo,
      assertPatientExists,
      assertFolderExists,
    ),
    listPatientMoveDestinations: new ListPatientMoveDestinationsUseCase(
      fileRepo,
      assertPatientExists,
    ),
    createPatientFolder: new CreatePatientFolderUseCase(
      fileRepo,
      assertPatientExists,
      assertFolderExists,
    ),
    renamePatientFolder: new RenamePatientFolderUseCase(
      fileRepo,
      assertPatientExists,
    ),
    movePatientFolder: new MovePatientFolderUseCase(
      fileRepo,
      assertPatientExists,
      assertFolderExists,
    ),
    deletePatientFolder: new DeletePatientFolderUseCase(
      fileRepo,
      assertPatientExists,
      storage,
    ),
    uploadPatientFile: new UploadPatientFileUseCase(
      fileRepo,
      assertPatientExists,
      assertFolderExists,
      storage,
    ),
    getPatientFileContent: new GetPatientFileContentUseCase(fileRepo, storage),
    renamePatientFile: new RenamePatientFileUseCase(
      fileRepo,
      assertPatientExists,
    ),
    movePatientFile: new MovePatientFileUseCase(
      fileRepo,
      assertPatientExists,
      assertFolderExists,
    ),
    deletePatientFile: new DeletePatientFileUseCase(
      fileRepo,
      assertPatientExists,
      storage,
    ),
  };
}

export function seedPatient(harness: PatientFilesTestHarness): void {
  seedMinimalPatient(harness.patientRepo, STORE_A, PATIENT_A);
}
