import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../../shared/domain/storage/object-storage.interface';
import { PatientFileNotFoundError } from '../../../domain/errors/patient-file-not-found.error';
import type {
  GetPatientFileContentDto,
  PatientFileContentResult,
} from '../../dtos/patient-file.dto';
import { PatientFileRepository } from '../../../domain/repositories/patient-file.repository.interface';

@Injectable()
export class GetPatientFileContentUseCase implements IUseCase<
  GetPatientFileContentDto,
  PatientFileContentResult
> {
  constructor(
    private readonly repository: PatientFileRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(
    dto: GetPatientFileContentDto,
  ): Promise<PatientFileContentResult> {
    const file = await this.repository.findFileById(
      dto.storeId,
      dto.patientId,
      dto.fileId,
    );
    if (!file) {
      throw new PatientFileNotFoundError(
        GetPatientFileContentUseCase.name,
        dto.fileId,
      );
    }

    const stored = await this.storage.get(file.objectKey);

    return {
      buffer: stored.buffer,
      mimeType: stored.mimeType,
      name: file.name,
    };
  }
}
