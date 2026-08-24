import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../../shared/domain/storage/object-storage.interface';
import { PatientFileNotFoundError } from '../../../domain/errors/patient-file-not-found.error';
import type { DeletePatientFileDto } from '../../dtos/patient-file.dto';
import { PatientFileRepository } from '../../../domain/repositories/patient-file.repository.interface';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';

@Injectable()
export class DeletePatientFileUseCase implements IUseCase<
  DeletePatientFileDto,
  void
> {
  constructor(
    private readonly repository: PatientFileRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(dto: DeletePatientFileDto): Promise<void> {
    await this.assertPatientExists.execute(
      DeletePatientFileUseCase.name,
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
        DeletePatientFileUseCase.name,
        dto.fileId,
      );
    }

    await this.storage.delete(file.objectKey);
    await this.repository.deleteFile(dto.storeId, dto.patientId, dto.fileId);
  }
}
