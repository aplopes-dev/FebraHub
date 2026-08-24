import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PatientRepository } from '../../../domain/repositories/patient.repository.interface';
import type { PatientDetail } from '../../../domain/repositories/patient.repository.interface';
import { PatientNotFoundError } from '../../../domain/errors/patient-not-found.error';
import type { FindPatientDto } from '../../dtos/patient.dto';

@Injectable()
export class FindPatientByIdUseCase implements IUseCase<
  FindPatientDto,
  PatientDetail
> {
  constructor(private readonly patientRepository: PatientRepository) {}

  async execute(dto: FindPatientDto): Promise<PatientDetail> {
    const detail = await this.patientRepository.findById(dto.storeId, dto.id);
    if (!detail) {
      throw new PatientNotFoundError(FindPatientByIdUseCase.name, dto.id);
    }
    return detail;
  }
}
