import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PatientPrescription } from '../../../domain/entities/patient-prescription.entity';
import { PatientPrescriptionRepository } from '../../../domain/repositories/patient-prescription.repository.interface';
import { PatientPrescriptionNotFoundError } from '../../../domain/errors/patient-prescription-not-found.error';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import type { FindPatientPrescriptionByIdDto } from '../../dtos/patient-prescription.dto';

@Injectable()
export class FindPatientPrescriptionByIdUseCase implements IUseCase<
  FindPatientPrescriptionByIdDto,
  PatientPrescription
> {
  constructor(
    private readonly prescriptionRepository: PatientPrescriptionRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
  ) {}

  async execute(
    dto: FindPatientPrescriptionByIdDto,
  ): Promise<PatientPrescription> {
    await this.assertPatientExists.execute(
      FindPatientPrescriptionByIdUseCase.name,
      dto.storeId,
      dto.patientId,
    );

    const prescription = await this.prescriptionRepository.findById(
      dto.storeId,
      dto.patientId,
      dto.prescriptionId,
    );

    if (!prescription) {
      throw new PatientPrescriptionNotFoundError(
        FindPatientPrescriptionByIdUseCase.name,
        dto.prescriptionId,
      );
    }

    return prescription;
  }
}
