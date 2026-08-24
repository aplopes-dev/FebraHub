import type { PatientFile } from '../domain/entities/patient-file.entity';
import type { PatientFolder } from '../domain/entities/patient-folder.entity';
import type { PatientDriveListCriteria } from '../domain/repositories/patient-file.repository.interface';
import { PatientFileRepository } from '../domain/repositories/patient-file.repository.interface';

function matchesSearch(name: string, search?: string): boolean {
  if (!search?.trim()) {
    return true;
  }
  return name.toLowerCase().includes(search.trim().toLowerCase());
}

export class InMemoryPatientFileRepository extends PatientFileRepository {
  private folders = new Map<string, PatientFolder>();
  private files = new Map<string, PatientFile>();

  seedFolder(folder: PatientFolder): void {
    this.folders.set(folder.id, folder);
  }

  seedFile(file: PatientFile): void {
    this.files.set(file.id, file);
  }

  async findFolderById(
    storeId: string,
    patientId: string,
    folderId: string,
  ): Promise<PatientFolder | null> {
    const folder = this.folders.get(folderId);
    if (
      !folder ||
      folder.storeId !== storeId ||
      folder.patientId !== patientId
    ) {
      return null;
    }
    return folder;
  }

  async findFoldersByParentId(
    storeId: string,
    patientId: string,
    criteria: PatientDriveListCriteria,
  ): Promise<PatientFolder[]> {
    return [...this.folders.values()].filter(
      (folder) =>
        folder.storeId === storeId &&
        folder.patientId === patientId &&
        folder.parentId === criteria.folderId &&
        matchesSearch(folder.name, criteria.search),
    );
  }

  async findAllFoldersByPatientId(
    storeId: string,
    patientId: string,
  ): Promise<PatientFolder[]> {
    return [...this.folders.values()].filter(
      (folder) => folder.storeId === storeId && folder.patientId === patientId,
    );
  }

  async saveFolder(folder: PatientFolder): Promise<PatientFolder> {
    this.folders.set(folder.id, folder);
    return folder;
  }

  async deleteFolder(
    storeId: string,
    patientId: string,
    folderId: string,
  ): Promise<void> {
    const folder = await this.findFolderById(storeId, patientId, folderId);
    if (folder) {
      this.folders.delete(folderId);
    }
  }

  async findFileById(
    storeId: string,
    patientId: string,
    fileId: string,
  ): Promise<PatientFile | null> {
    const file = this.files.get(fileId);
    if (!file || file.storeId !== storeId || file.patientId !== patientId) {
      return null;
    }
    return file;
  }

  async findFilesByFolderId(
    storeId: string,
    patientId: string,
    criteria: PatientDriveListCriteria,
  ): Promise<PatientFile[]> {
    return [...this.files.values()].filter(
      (file) =>
        file.storeId === storeId &&
        file.patientId === patientId &&
        file.folderId === criteria.folderId &&
        matchesSearch(file.name, criteria.search),
    );
  }

  async findFilesByFolderIds(
    storeId: string,
    patientId: string,
    folderIds: string[],
  ): Promise<PatientFile[]> {
    const folderIdSet = new Set(folderIds);
    return [...this.files.values()].filter(
      (file) =>
        file.storeId === storeId &&
        file.patientId === patientId &&
        file.folderId !== null &&
        folderIdSet.has(file.folderId),
    );
  }

  async saveFile(file: PatientFile): Promise<PatientFile> {
    this.files.set(file.id, file);
    return file;
  }

  async deleteFile(
    storeId: string,
    patientId: string,
    fileId: string,
  ): Promise<void> {
    const file = await this.findFileById(storeId, patientId, fileId);
    if (file) {
      this.files.delete(fileId);
    }
  }
}
