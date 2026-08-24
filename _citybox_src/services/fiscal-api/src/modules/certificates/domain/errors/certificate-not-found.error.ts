import { DomainError } from '../../../../shared/core/errors/domain.error';

export class CertificateNotFoundError extends DomainError {
  constructor(context: string, certificateId: string) {
    super({
      internalMessage: `Certificate "${certificateId}" not found`,
      externalMessage: 'Certificado não encontrado',
      context,
    });
  }
}
