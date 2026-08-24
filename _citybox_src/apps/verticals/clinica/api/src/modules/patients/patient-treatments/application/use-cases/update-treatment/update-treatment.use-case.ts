import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PatientRepository } from '../../../../domain/repositories/patient.repository.interface';
import { PatientNotFoundError } from '../../../../domain/errors/patient-not-found.error';
import { PatientTreatmentRepository } from '../../../domain/repositories/patient-treatment.repository.interface';
import { PatientTreatment } from '../../../domain/entities/patient-treatment.entity';
import { PatientTreatmentNotFoundError } from '../../../domain/errors/patient-treatment-not-found.error';
import { PatientTreatmentCompletedError } from '../../../domain/errors/patient-treatment-completed.error';
import type { UpdatePatientTreatmentDto } from '../../../application/dtos/patient-treatment.dto';

@Injectable()
export class UpdatePatientTreatmentUseCase implements IUseCase<
  UpdatePatientTreatmentDto,
  PatientTreatment
> {
  constructor(
    private readonly patientRepository: PatientRepository,
    private readonly treatmentRepository: PatientTreatmentRepository,
  ) {}

  async execute(dto: UpdatePatientTreatmentDto): Promise<PatientTreatment> {
    await this.assertPatientExists(dto.storeId, dto.patientId);

    const treatment = await this.treatmentRepository.findById(
      dto.storeId,
      dto.patientId,
      dto.id,
    );
    if (!treatment) {
      throw new PatientTreatmentNotFoundError(
        UpdatePatientTreatmentUseCase.name,
        dto.id,
      );
    }

    if (treatment.isCompleted) {
      throw new PatientTreatmentCompletedError(
        UpdatePatientTreatmentUseCase.name,
        dto.id,
      );
    }

    treatment.updateClinicalNotes({
      diagnosis: dto.diagnosis,
      observation: dto.observation,
    });

    return this.treatmentRepository.save(treatment);
  }

  private async assertPatientExists(
    storeId: string,
    patientId: string,
  ): Promise<void> {
    const patient = await this.patientRepository.findById(storeId, patientId);
    if (!patient) {
      throw new PatientNotFoundError(
        UpdatePatientTreatmentUseCase.name,
        patientId,
      );
    }
  }
}
