import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PatientCertificateRepository } from '../../../domain/repositories/patient-certificate.repository.interface';
import { PatientCertificateNotFoundError } from '../../../domain/errors/patient-certificate-not-found.error';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import type { DeletePatientCertificateDto } from '../../dtos/patient-certificate.dto';

@Injectable()
export class DeletePatientCertificateUseCase implements IUseCase<
  DeletePatientCertificateDto,
  void
> {
  constructor(
    private readonly certificateRepository: PatientCertificateRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
  ) {}

  async execute(dto: DeletePatientCertificateDto): Promise<void> {
    await this.assertPatientExists.execute(
      DeletePatientCertificateUseCase.name,
      dto.storeId,
      dto.patientId,
    );

    const existing = await this.certificateRepository.findById(
      dto.storeId,
      dto.patientId,
      dto.certificateId,
    );

    if (!existing) {
      throw new PatientCertificateNotFoundError(
        DeletePatientCertificateUseCase.name,
        dto.certificateId,
      );
    }

    await this.certificateRepository.delete(
      dto.storeId,
      dto.patientId,
      dto.certificateId,
    );
  }
}
