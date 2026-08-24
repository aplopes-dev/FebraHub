import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { ResolveProfessionalCouncilService } from '../../../../../members/application/services/resolve-professional-council.service';
import { PatientRepository } from '../../../../domain/repositories/patient.repository.interface';
import { PatientNotFoundError } from '../../../../domain/errors/patient-not-found.error';
import { PatientPrescription } from '../../../domain/entities/patient-prescription.entity';
import { PatientPrescriptionRepository } from '../../../domain/repositories/patient-prescription.repository.interface';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import { ValidatePatientPrescriptionService } from '../../services/validate-patient-prescription.service';
import {
  normalizeClinicName,
  parseIssuedDate,
  type CreatePatientPrescriptionDto,
} from '../../dtos/patient-prescription.dto';

@Injectable()
export class CreatePatientPrescriptionUseCase implements IUseCase<
  CreatePatientPrescriptionDto,
  PatientPrescription
> {
  constructor(
    private readonly prescriptionRepository: PatientPrescriptionRepository,
    private readonly patientRepository: PatientRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
    private readonly validatePrescription: ValidatePatientPrescriptionService,
    private readonly resolveProfessionalCouncil: ResolveProfessionalCouncilService,
  ) {}

  async execute(
    dto: CreatePatientPrescriptionDto,
  ): Promise<PatientPrescription> {
    await this.assertPatientExists.execute(
      CreatePatientPrescriptionUseCase.name,
      dto.storeId,
      dto.patientId,
    );

    this.validatePrescription.execute(
      CreatePatientPrescriptionUseCase.name,
      dto.input,
    );

    const patientDetail = await this.patientRepository.findById(
      dto.storeId,
      dto.patientId,
    );
    if (!patientDetail) {
      throw new PatientNotFoundError(
        CreatePatientPrescriptionUseCase.name,
        dto.patientId,
      );
    }

    const professionalId = dto.input.professionalId.trim();
    const council = await this.resolveProfessionalCouncil.execute({
      context: CreatePatientPrescriptionUseCase.name,
      professionalId,
      storeId: dto.storeId,
      input: {
        councilType: dto.input.councilType,
        councilNumber: dto.input.councilNumber,
        councilUf: dto.input.councilUf,
      },
    });

    const prescription = PatientPrescription.create({
      storeId: dto.storeId,
      patientId: dto.patientId,
      professionalId,
      professionalName: dto.input.professionalName.trim(),
      councilType: council.councilType,
      councilNumber: council.councilNumber,
      councilUf: council.councilUf,
      patientName: patientDetail.patient.name,
      clinicName: normalizeClinicName(dto.input.clinicName),
      issuedDate: parseIssuedDate(dto.input.issuedDate),
      issuedAt: new Date(),
      items: dto.input.items,
    });

    return this.prescriptionRepository.save(prescription);
  }
}
