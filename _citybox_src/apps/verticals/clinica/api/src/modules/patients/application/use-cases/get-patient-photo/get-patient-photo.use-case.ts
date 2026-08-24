import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { PatientRepository } from '../../../domain/repositories/patient.repository.interface';
import { PatientNotFoundError } from '../../../domain/errors/patient-not-found.error';
import type { GetPatientPhotoDto } from '../../dtos/patient.dto';

type PhotoResult = { buffer: Buffer; mimeType: string };

@Injectable()
export class GetPatientPhotoUseCase implements IUseCase<
  GetPatientPhotoDto,
  PhotoResult
> {
  constructor(
    private readonly patientRepository: PatientRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(dto: GetPatientPhotoDto): Promise<PhotoResult> {
    const detail = await this.patientRepository.findById(
      dto.storeId,
      dto.patientId,
    );
    if (!detail || !detail.patient.hasPhoto()) {
      throw new PatientNotFoundError(
        GetPatientPhotoUseCase.name,
        dto.patientId,
      );
    }

    const stored = await this.storage.get(detail.patient.photoObjectKey!);
    return { buffer: stored.buffer, mimeType: stored.mimeType };
  }
}
