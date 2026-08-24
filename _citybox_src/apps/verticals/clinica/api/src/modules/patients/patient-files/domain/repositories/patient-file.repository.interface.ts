import type { PatientFile } from '../entities/patient-file.entity';
import type { PatientFolder } from '../entities/patient-folder.entity';

export type PatientDriveListCriteria = {
  folderId: string | null;
  search?: string;
};

export abstract class PatientFileRepository {
  abstract findFolderById(
    storeId: string,
    patientId: string,
    folderId: string,
  ): Promise<PatientFolder | null>;

  abstract findFoldersByParentId(
    storeId: string,
    patientId: string,
    criteria: PatientDriveListCriteria,
  ): Promise<PatientFolder[]>;

  abstract findAllFoldersByPatientId(
    storeId: string,
    patientId: string,
  ): Promise<PatientFolder[]>;

  abstract saveFolder(folder: PatientFolder): Promise<PatientFolder>;

  abstract deleteFolder(
    storeId: string,
    patientId: string,
    folderId: string,
  ): Promise<void>;

  abstract findFileById(
    storeId: string,
    patientId: string,
    fileId: string,
  ): Promise<PatientFile | null>;

  abstract findFilesByFolderId(
    storeId: string,
    patientId: string,
    criteria: PatientDriveListCriteria,
  ): Promise<PatientFile[]>;

  abstract findFilesByFolderIds(
    storeId: string,
    patientId: string,
    folderIds: string[],
  ): Promise<PatientFile[]>;

  abstract saveFile(file: PatientFile): Promise<PatientFile>;

  abstract deleteFile(
    storeId: string,
    patientId: string,
    fileId: string,
  ): Promise<void>;
}
