import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PatientRepository } from '../../../../domain/repositories/patient.repository.interface';
import { PatientNotFoundError } from '../../../../domain/errors/patient-not-found.error';
import { PatientPrescription } from '../../../domain/entities/patient-prescription.entity';
import { PatientPrescriptionRepository } from '../../../domain/repositories/patient-prescription.repository.interface';
import { PatientPrescriptionNotFoundError } from '../../../domain/errors/patient-prescription-not-found.error';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import { ValidatePatientPrescriptionService } from '../../services/validate-patient-prescription.service';
import {
  normalizeClinicName,
  parseIssuedDate,
  type UpdatePatientPrescriptionDto,
} from '../../dtos/patient-prescription.dto';

@Injectable()
export class UpdatePatientPrescriptionUseCase implements IUseCase<
  UpdatePatientPrescriptionDto,
  PatientPrescription
> {
  constructor(
    private readonly prescriptionRepository: PatientPrescriptionRepository,
    private readonly patientRepository: PatientRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
    private readonly validatePrescription: ValidatePatientPrescriptionService,
  ) {}

  async execute(
    dto: UpdatePatientPrescriptionDto,
  ): Promise<PatientPrescription> {
    await this.assertPatientExists.execute(
      UpdatePatientPrescriptionUseCase.name,
      dto.storeId,
      dto.patientId,
    );

    const existing = await this.prescriptionRepository.findById(
      dto.storeId,
      dto.patientId,
      dto.prescriptionId,
    );
    if (!existing) {
      throw new PatientPrescriptionNotFoundError(
        UpdatePatientPrescriptionUseCase.name,
        dto.prescriptionId,
      );
    }

    this.validatePrescription.execute(
      UpdatePatientPrescriptionUseCase.name,
      dto.input,
    );

    const patientDetail = await this.patientRepository.findById(
      dto.storeId,
      dto.patientId,
    );
    if (!patientDetail) {
      throw new PatientNotFoundError(
        UpdatePatientPrescriptionUseCase.name,
        dto.patientId,
      );
    }

    const updated = existing.withUpdatedContent({
      professionalId: dto.input.professionalId.trim(),
      professionalName: dto.input.professionalName.trim(),
      patientName: patientDetail.patient.name,
      clinicName: normalizeClinicName(dto.input.clinicName),
      issuedDate: parseIssuedDate(dto.input.issuedDate),
      items: dto.input.items,
    });

    return this.prescriptionRepository.save(updated);
  }
}
