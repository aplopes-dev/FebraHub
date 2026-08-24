import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PatientPrescriptionRepository } from '../../../domain/repositories/patient-prescription.repository.interface';
import { PatientPrescriptionNotFoundError } from '../../../domain/errors/patient-prescription-not-found.error';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import type { DeletePatientPrescriptionDto } from '../../dtos/patient-prescription.dto';

@Injectable()
export class DeletePatientPrescriptionUseCase implements IUseCase<
  DeletePatientPrescriptionDto,
  void
> {
  constructor(
    private readonly prescriptionRepository: PatientPrescriptionRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
  ) {}

  async execute(dto: DeletePatientPrescriptionDto): Promise<void> {
    await this.assertPatientExists.execute(
      DeletePatientPrescriptionUseCase.name,
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
        DeletePatientPrescriptionUseCase.name,
        dto.prescriptionId,
      );
    }

    await this.prescriptionRepository.delete(
      dto.storeId,
      dto.patientId,
      dto.prescriptionId,
    );
  }
}
