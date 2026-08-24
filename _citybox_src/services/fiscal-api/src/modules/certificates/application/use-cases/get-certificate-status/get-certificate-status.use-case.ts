import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { CertificateRepository } from '../../../domain/repositories/certificate.repository.interface';
import { CertificateNotFoundError } from '../../../domain/errors/certificate-not-found.error';
import type { GetCertificateStatusDto } from '../../dtos/certificate.dto';

export type CertificateStatusResult = {
  status: string;
  validUntil: Date;
  daysUntilExpiration: number;
};

/// `GET /certificates/{id}/status` (US3 Acceptance Scenario 3) — usada antes
/// de qualquer emissão (FR-008) e para sinalizar expiração próxima.
@Injectable()
export class GetCertificateStatusUseCase implements IUseCase<
  GetCertificateStatusDto,
  CertificateStatusResult
> {
  constructor(private readonly certificateRepository: CertificateRepository) {}

  async execute(
    dto: GetCertificateStatusDto,
  ): Promise<CertificateStatusResult> {
    const certificate = await this.certificateRepository.findById(
      dto.certificateId,
    );
    if (!certificate) {
      throw new CertificateNotFoundError(
        GetCertificateStatusUseCase.name,
        dto.certificateId,
      );
    }

    return {
      status: certificate.status,
      validUntil: certificate.validUntil,
      daysUntilExpiration: certificate.daysUntilExpiration(),
    };
  }
}
