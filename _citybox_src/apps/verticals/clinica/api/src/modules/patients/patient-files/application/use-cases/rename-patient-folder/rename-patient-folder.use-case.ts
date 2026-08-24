import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PatientFolder } from '../../../domain/entities/patient-folder.entity';
import { PatientFolderNotFoundError } from '../../../domain/errors/patient-folder-not-found.error';
import type { RenamePatientFolderDto } from '../../dtos/patient-file.dto';
import { PatientFileRepository } from '../../../domain/repositories/patient-file.repository.interface';
import { PatientFolderNameValidator } from '../../../domain/validators/patient-folder-name.validator';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';

@Injectable()
export class RenamePatientFolderUseCase implements IUseCase<
  RenamePatientFolderDto,
  PatientFolder
> {
  constructor(
    private readonly repository: PatientFileRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
  ) {}

  async execute(dto: RenamePatientFolderDto): Promise<PatientFolder> {
    await this.assertPatientExists.execute(
      RenamePatientFolderUseCase.name,
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
        RenamePatientFolderUseCase.name,
        dto.folderId,
      );
    }

    const name = PatientFolderNameValidator.validate(
      dto.name,
      RenamePatientFolderUseCase.name,
    );

    return this.repository.saveFolder(folder.withName(name));
  }
}
