import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import type { PatientCertificate } from '../../../domain/entities/patient-certificate.entity';
import { PatientCertificateRepository } from '../../../domain/repositories/patient-certificate.repository.interface';
import { PatientCertificateNotFoundError } from '../../../domain/errors/patient-certificate-not-found.error';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import type { FindPatientCertificateByIdDto } from '../../dtos/patient-certificate.dto';

@Injectable()
export class FindPatientCertificateByIdUseCase implements IUseCase<
  FindPatientCertificateByIdDto,
  PatientCertificate
> {
  constructor(
    private readonly certificateRepository: PatientCertificateRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
  ) {}

  async execute(
    dto: FindPatientCertificateByIdDto,
  ): Promise<PatientCertificate> {
    await this.assertPatientExists.execute(
      FindPatientCertificateByIdUseCase.name,
      dto.storeId,
      dto.patientId,
    );

    const certificate = await this.certificateRepository.findById(
      dto.storeId,
      dto.patientId,
      dto.certificateId,
    );

    if (!certificate) {
      throw new PatientCertificateNotFoundError(
        FindPatientCertificateByIdUseCase.name,
        dto.certificateId,
      );
    }

    return certificate;
  }
}
