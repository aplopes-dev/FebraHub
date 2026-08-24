import { DomainError } from '../../../../shared/core/errors/domain.error';

/// FR-008 — bloqueia qualquer emissão sem certificado digital válido e
/// vigente associado ao Emitente.
export class CertificateNotValidError extends DomainError {
  constructor(context: string, companyId: string) {
    super({
      internalMessage: `Company "${companyId}" has no valid, current certificate`,
      externalMessage:
        'Emitente não possui certificado digital válido para assinatura',
      context,
    });
  }
}
