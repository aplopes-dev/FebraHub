import { DomainError } from '../../../../shared/core/errors/domain.error';

/// Mapeia para 409 via AppExceptionFilter (nome contém "Conflict") —
/// `PATCH /certificates/{id}/activate` exige que o certificado alvo já
/// esteja `VALID` (contracts/certificates-api.md); ativar um certificado
/// `EXPIRED`/`INVALID`/`REVOKED` é rejeitado.
export class CertificateNotValidForActivationConflictError extends DomainError {
  constructor(context: string, certificateId: string, status: string) {
    super({
      internalMessage: `Certificate "${certificateId}" cannot be activated — current status is "${status}", not VALID`,
      externalMessage: 'Certificado não está válido e não pode ser ativado',
      context,
    });
  }
}
