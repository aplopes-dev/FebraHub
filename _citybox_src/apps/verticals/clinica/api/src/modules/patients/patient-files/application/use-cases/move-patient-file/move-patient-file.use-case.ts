import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PatientFile } from '../../../domain/entities/patient-file.entity';
import { PatientFileNotFoundError } from '../../../domain/errors/patient-file-not-found.error';
import type { MovePatientFileDto } from '../../dtos/patient-file.dto';
import { PatientFileRepository } from '../../../domain/repositories/patient-file.repository.interface';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import { AssertPatientFolderExistsService } from '../../services/assert-patient-folder-exists.service';

@Injectable()
export class MovePatientFileUseCase implements IUseCase<
  MovePatientFileDto,
  PatientFile
> {
  constructor(
    private readonly repository: PatientFileRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
    private readonly assertFolderExists: AssertPatientFolderExistsService,
  ) {}

  async execute(dto: MovePatientFileDto): Promise<PatientFile> {
    await this.assertPatientExists.execute(
      MovePatientFileUseCase.name,
      dto.storeId,
      dto.patientId,
    );

    const file = await this.repository.findFileById(
      dto.storeId,
      dto.patientId,
      dto.fileId,
    );
    if (!file) {
      throw new PatientFileNotFoundError(
        MovePatientFileUseCase.name,
        dto.fileId,
      );
    }

    await this.assertFolderExists.executeOptionalParent(
      MovePatientFileUseCase.name,
      dto.storeId,
      dto.patientId,
      dto.folderId,
    );

    return this.repository.saveFile(file.withFolderId(dto.folderId));
  }
}
