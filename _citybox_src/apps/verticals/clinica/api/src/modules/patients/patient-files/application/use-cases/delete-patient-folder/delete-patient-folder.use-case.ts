import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../../shared/domain/storage/object-storage.interface';
import { PatientFolderNotFoundError } from '../../../domain/errors/patient-folder-not-found.error';
import type { DeletePatientFolderDto } from '../../dtos/patient-file.dto';
import { PatientFileRepository } from '../../../domain/repositories/patient-file.repository.interface';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import { collectDescendantFolderIds } from '../../utils/patient-drive.utils';

@Injectable()
export class DeletePatientFolderUseCase implements IUseCase<
  DeletePatientFolderDto,
  void
> {
  constructor(
    private readonly repository: PatientFileRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(dto: DeletePatientFolderDto): Promise<void> {
    await this.assertPatientExists.execute(
      DeletePatientFolderUseCase.name,
      dto.storeId,
      dto.patientId,
    );

    const folder = await this.repository.findFolderById(
      dto.storeId,
      dto.patientId,
      dto.folderId,
    );
    if (!folder) {
      throw new PatientFolderNotFoundError(
        DeletePatientFolderUseCase.name,
        dto.folderId,
      );
    }

    const allFolders = await this.repository.findAllFoldersByPatientId(
      dto.storeId,
      dto.patientId,
    );
    const folderIds = [...collectDescendantFolderIds(allFolders, dto.folderId)];
    const files = await this.repository.findFilesByFolderIds(
      dto.storeId,
      dto.patientId,
      folderIds,
    );

    await Promise.all(files.map((file) => this.storage.delete(file.objectKey)));

    for (const file of files) {
      await this.repository.deleteFile(dto.storeId, dto.patientId, file.id);
    }

    for (const folderId of [...folderIds].reverse()) {
      await this.repository.deleteFolder(dto.storeId, dto.patientId, folderId);
    }
  }
}
