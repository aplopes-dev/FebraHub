import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PatientFolder } from '../../../domain/entities/patient-folder.entity';
import type { CreatePatientFolderDto } from '../../dtos/patient-file.dto';
import { PatientFileRepository } from '../../../domain/repositories/patient-file.repository.interface';
import { PatientFolderNameValidator } from '../../../domain/validators/patient-folder-name.validator';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import { AssertPatientFolderExistsService } from '../../services/assert-patient-folder-exists.service';

@Injectable()
export class CreatePatientFolderUseCase implements IUseCase<
  CreatePatientFolderDto,
  PatientFolder
> {
  constructor(
    private readonly repository: PatientFileRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
    private readonly assertFolderExists: AssertPatientFolderExistsService,
  ) {}

  async execute(dto: CreatePatientFolderDto): Promise<PatientFolder> {
    await this.assertPatientExists.execute(
      CreatePatientFolderUseCase.name,
      dto.storeId,
      dto.patientId,
    );

    await this.assertFolderExists.executeOptionalParent(
      CreatePatientFolderUseCase.name,
      dto.storeId,
      dto.patientId,
      dto.parentId,
    );

    const name = PatientFolderNameValidator.validate(
      dto.name,
      CreatePatientFolderUseCase.name,
    );

    const folder = PatientFolder.create({
      storeId: dto.storeId,
      patientId: dto.patientId,
      parentId: dto.parentId,
      name,
    });

    return this.repository.saveFolder(folder);
  }
}
