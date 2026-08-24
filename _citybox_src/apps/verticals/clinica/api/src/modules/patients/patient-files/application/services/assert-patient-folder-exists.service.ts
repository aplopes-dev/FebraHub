import { Injectable } from '@nestjs/common';
import { PatientFolderNotFoundError } from '../../domain/errors/patient-folder-not-found.error';
import { PatientFileRepository } from '../../domain/repositories/patient-file.repository.interface';

@Injectable()
export class AssertPatientFolderExistsService {
  constructor(private readonly repository: PatientFileRepository) {}

  async execute(
    context: string,
    storeId: string,
    patientId: string,
    folderId: string,
  ): Promise<void> {
    const folder = await this.repository.findFolderById(
      storeId,
      patientId,
      folderId,
    );
    if (!folder) {
      throw new PatientFolderNotFoundError(context, folderId);
    }
  }

  async executeOptionalParent(
    context: string,
    storeId: string,
    patientId: string,
    parentId: string | null,
  ): Promise<void> {
    if (parentId === null) {
      return;
    }
    await this.execute(context, storeId, patientId, parentId);
  }
}
