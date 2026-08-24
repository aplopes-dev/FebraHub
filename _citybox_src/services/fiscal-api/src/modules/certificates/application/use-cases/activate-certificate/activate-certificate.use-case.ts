import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { CertificateRepository } from '../../../domain/repositories/certificate.repository.interface';
import { Certificate } from '../../../domain/entities/certificate.entity';
import { CertificateNotFoundError } from '../../../domain/errors/certificate-not-found.error';
import { CertificateNotValidForActivationConflictError } from '../../../domain/errors/certificate-not-valid-for-activation.error';
import type { ActivateCertificateDto } from '../../dtos/certificate.dto';

/// `PATCH /certificates/{id}/activate` (contracts/certificates-api.md) — o
/// sistema tolera mais de uma linha `VALID` simultânea por Emitente (ver
/// `CertificateRepository.findValidByCompanyId`, que resolve pela mais
/// recente); este caso de uso não muda `status` (o contrato exige que o
/// alvo já esteja `VALID` — 409 caso contrário), servindo como confirmação
/// explícita/auditável de qual certificado o operador pretende usar. Se o
/// produto precisar de fato forçar um certificado mais antigo a "vencer"
/// sobre um upload mais recente, isso exige um campo `active` dedicado no
/// schema (evolução futura, não necessária para satisfazer o contrato v1
/// literal).
@Injectable()
export class ActivateCertificateUseCase implements IUseCase<
  ActivateCertificateDto,
  Certificate
> {
  constructor(private readonly certificateRepository: CertificateRepository) {}

  async execute(dto: ActivateCertificateDto): Promise<Certificate> {
    const certificate = await this.certificateRepository.findById(
      dto.certificateId,
    );
    if (!certificate) {
      throw new CertificateNotFoundError(
        ActivateCertificateUseCase.name,
        dto.certificateId,
      );
    }

    if (certificate.status !== 'VALID') {
      throw new CertificateNotValidForActivationConflictError(
        ActivateCertificateUseCase.name,
        certificate.id,
        certificate.status,
      );
    }

    return certificate;
  }
}
