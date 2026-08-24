import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { ImageFileValidator } from '../../../../clinic-profile/application/validators/image-file.validator';
import { PatientRepository } from '../../../domain/repositories/patient.repository.interface';
import { PatientNotFoundError } from '../../../domain/errors/patient-not-found.error';
import { PatientObjectKeyPolicy } from '../../policies/patient-object-key.policy';
import type { UploadPatientPhotoDto } from '../../dtos/patient.dto';
import type { PatientDetail } from '../../../domain/repositories/patient.repository.interface';

@Injectable()
export class UploadPatientPhotoUseCase implements IUseCase<
  UploadPatientPhotoDto,
  PatientDetail
> {
  constructor(
    private readonly patientRepository: PatientRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(dto: UploadPatientPhotoDto): Promise<PatientDetail> {
    const detail = await this.patientRepository.findById(
      dto.storeId,
      dto.patientId,
    );
    if (!detail) {
      throw new PatientNotFoundError(
        UploadPatientPhotoUseCase.name,
        dto.patientId,
      );
    }

    const mimeType = ImageFileValidator.validate(
      dto.buffer,
      dto.declaredMimeType,
    );

    if (detail.patient.hasPhoto()) {
      await this.storage.delete(detail.patient.photoObjectKey!);
    }

    const key = PatientObjectKeyPolicy.photoKey(
      dto.storeId,
      dto.patientId,
      mimeType,
    );

    await this.storage.put({ key, buffer: dto.buffer, mimeType });
    detail.patient.setPhoto(key, mimeType);
    await this.patientRepository.save(detail.patient);

    const updated = await this.patientRepository.findById(
      dto.storeId,
      dto.patientId,
    );
    if (!updated) {
      throw new PatientNotFoundError(
        UploadPatientPhotoUseCase.name,
        dto.patientId,
      );
    }
    return updated;
  }
}
