import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PatientRepository } from '../../../../domain/repositories/patient.repository.interface';
import { PatientNotFoundError } from '../../../../domain/errors/patient-not-found.error';
import { PatientTreatmentRepository } from '../../../domain/repositories/patient-treatment.repository.interface';
import type { PatientTreatment } from '../../../domain/entities/patient-treatment.entity';
import type { ListPatientTreatmentsDto } from '../../../application/dtos/patient-treatment.dto';

@Injectable()
export class ListPatientTreatmentsUseCase implements IUseCase<
  ListPatientTreatmentsDto,
  PatientTreatment[]
> {
  constructor(
    private readonly patientRepository: PatientRepository,
    private readonly treatmentRepository: PatientTreatmentRepository,
  ) {}

  async execute(dto: ListPatientTreatmentsDto): Promise<PatientTreatment[]> {
    await this.assertPatientExists(dto.storeId, dto.patientId);
    return this.treatmentRepository.findByPatient(dto.storeId, dto.patientId);
  }

  private async assertPatientExists(
    storeId: string,
    patientId: string,
  ): Promise<void> {
    const patient = await this.patientRepository.findById(storeId, patientId);
    if (!patient) {
      throw new PatientNotFoundError(
        ListPatientTreatmentsUseCase.name,
        patientId,
      );
    }
  }
}
