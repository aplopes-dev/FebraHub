import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PatientFolder } from '../../../domain/entities/patient-folder.entity';
import { InvalidPatientFolderMoveError } from '../../../domain/errors/invalid-patient-folder-move.error';
import { PatientFolderNotFoundError } from '../../../domain/errors/patient-folder-not-found.error';
import type { MovePatientFolderDto } from '../../dtos/patient-file.dto';
import { PatientFileRepository } from '../../../domain/repositories/patient-file.repository.interface';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import { AssertPatientFolderExistsService } from '../../services/assert-patient-folder-exists.service';
import { isFolderDescendantOf } from '../../utils/patient-drive.utils';

@Injectable()
export class MovePatientFolderUseCase implements IUseCase<
  MovePatientFolderDto,
  PatientFolder
> {
  constructor(
    private readonly repository: PatientFileRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
    private readonly assertFolderExists: AssertPatientFolderExistsService,
  ) {}

  async execute(dto: MovePatientFolderDto): Promise<PatientFolder> {
    await this.assertPatientExists.execute(
      MovePatientFolderUseCase.name,
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
        MovePatientFolderUseCase.name,
        dto.folderId,
      );
    }

    await this.assertFolderExists.executeOptionalParent(
      MovePatientFolderUseCase.name,
      dto.storeId,
      dto.patientId,
      dto.parentId,
    );

    if (dto.parentId !== null) {
      const folders = await this.repository.findAllFoldersByPatientId(
        dto.storeId,
        dto.patientId,
      );
      if (isFolderDescendantOf(folders, dto.folderId, dto.parentId)) {
        throw new InvalidPatientFolderMoveError(
          MovePatientFolderUseCase.name,
          dto.folderId,
        );
      }
    }

    return this.repository.saveFolder(folder.withParentId(dto.parentId));
  }
}
