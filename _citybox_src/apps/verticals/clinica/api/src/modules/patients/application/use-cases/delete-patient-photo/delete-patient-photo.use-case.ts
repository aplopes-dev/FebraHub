import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { PatientRepository } from '../../../domain/repositories/patient.repository.interface';
import type { PatientDetail } from '../../../domain/repositories/patient.repository.interface';
import { PatientNotFoundError } from '../../../domain/errors/patient-not-found.error';
import type { DeletePatientPhotoDto } from '../../dtos/patient.dto';

@Injectable()
export class DeletePatientPhotoUseCase implements IUseCase<
  DeletePatientPhotoDto,
  PatientDetail
> {
  constructor(
    private readonly patientRepository: PatientRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(dto: DeletePatientPhotoDto): Promise<PatientDetail> {
    const detail = await this.patientRepository.findById(
      dto.storeId,
      dto.patientId,
    );
    if (!detail) {
      throw new PatientNotFoundError(
        DeletePatientPhotoUseCase.name,
        dto.patientId,
      );
    }

    if (detail.patient.hasPhoto()) {
      await this.storage.delete(detail.patient.photoObjectKey!);
      detail.patient.clearPhoto();
      await this.patientRepository.save(detail.patient);
    }

    const updated = await this.patientRepository.findById(
      dto.storeId,
      dto.patientId,
    );
    if (!updated) {
      throw new PatientNotFoundError(
        DeletePatientPhotoUseCase.name,
        dto.patientId,
      );
    }
    return updated;
  }
}
