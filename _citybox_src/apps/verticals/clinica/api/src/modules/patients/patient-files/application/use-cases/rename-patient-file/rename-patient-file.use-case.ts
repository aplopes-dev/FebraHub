import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { ValidatorDomainError } from '../../../../../../shared/core/errors/validator-domain.error';
import { PatientFile } from '../../../domain/entities/patient-file.entity';
import { PatientFileNotFoundError } from '../../../domain/errors/patient-file-not-found.error';
import type { RenamePatientFileDto } from '../../dtos/patient-file.dto';
import { PatientFileRepository } from '../../../domain/repositories/patient-file.repository.interface';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';

@Injectable()
export class RenamePatientFileUseCase implements IUseCase<
  RenamePatientFileDto,
  PatientFile
> {
  constructor(
    private readonly repository: PatientFileRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
  ) {}

  async execute(dto: RenamePatientFileDto): Promise<PatientFile> {
    await this.assertPatientExists.execute(
      RenamePatientFileUseCase.name,
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
        RenamePatientFileUseCase.name,
        dto.fileId,
      );
    }

    const name = dto.name.trim();
    if (!name) {
      throw new ValidatorDomainError({
        internalMessage: 'File name is required',
        externalMessage: 'Informe o nome do arquivo',
        context: RenamePatientFileUseCase.name,
      });
    }

    return this.repository.saveFile(file.withName(name));
  }
}
