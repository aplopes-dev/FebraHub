import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PatientRepository } from '../../../../domain/repositories/patient.repository.interface';
import { PatientNotFoundError } from '../../../../domain/errors/patient-not-found.error';
import { PatientTreatmentRepository } from '../../../domain/repositories/patient-treatment.repository.interface';
import { PatientTreatmentNotFoundError } from '../../../domain/errors/patient-treatment-not-found.error';
import { PatientTreatmentCompletedError } from '../../../domain/errors/patient-treatment-completed.error';
import type { DeletePatientTreatmentDto } from '../../../application/dtos/patient-treatment.dto';

@Injectable()
export class DeletePatientTreatmentUseCase implements IUseCase<
  DeletePatientTreatmentDto,
  void
> {
  constructor(
    private readonly patientRepository: PatientRepository,
    private readonly treatmentRepository: PatientTreatmentRepository,
  ) {}

  async execute(dto: DeletePatientTreatmentDto): Promise<void> {
    await this.assertPatientExists(dto.storeId, dto.patientId);

    const treatment = await this.treatmentRepository.findById(
      dto.storeId,
      dto.patientId,
      dto.id,
    );
    if (!treatment) {
      throw new PatientTreatmentNotFoundError(
        DeletePatientTreatmentUseCase.name,
        dto.id,
      );
    }

    if (treatment.isCompleted) {
      throw new PatientTreatmentCompletedError(
        DeletePatientTreatmentUseCase.name,
        dto.id,
      );
    }

    await this.treatmentRepository.delete(dto.storeId, dto.patientId, dto.id);
  }

  private async assertPatientExists(
    storeId: string,
    patientId: string,
  ): Promise<void> {
    const patient = await this.patientRepository.findById(storeId, patientId);
    if (!patient) {
      throw new PatientNotFoundError(
        DeletePatientTreatmentUseCase.name,
        patientId,
      );
    }
  }
}
