import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PatientRepository } from '../../../domain/repositories/patient.repository.interface';
import type { PatientDetail } from '../../../domain/repositories/patient.repository.interface';
import { PatientNotFoundError } from '../../../domain/errors/patient-not-found.error';
import type { UpdatePatientStatusDto } from '../../dtos/patient.dto';

@Injectable()
export class UpdatePatientStatusUseCase implements IUseCase<
  UpdatePatientStatusDto,
  PatientDetail
> {
  constructor(private readonly patientRepository: PatientRepository) {}

  async execute(dto: UpdatePatientStatusDto): Promise<PatientDetail> {
    const detail = await this.patientRepository.findById(dto.storeId, dto.id);
    if (!detail) {
      throw new PatientNotFoundError(UpdatePatientStatusUseCase.name, dto.id);
    }

    detail.patient.changeStatus(dto.status);
    await this.patientRepository.save(detail.patient);

    const updated = await this.patientRepository.findById(dto.storeId, dto.id);
    if (!updated) {
      throw new PatientNotFoundError(UpdatePatientStatusUseCase.name, dto.id);
    }
    return updated;
  }
}
