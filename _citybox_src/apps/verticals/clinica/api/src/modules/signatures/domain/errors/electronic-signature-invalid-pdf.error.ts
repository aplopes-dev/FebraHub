import { DomainError } from '../../../../shared/core/errors/domain.error';

export class ElectronicSignatureInvalidPdfError extends DomainError {
  constructor(context: string) {
    super({
      internalMessage: 'Invalid or empty PDF base64 for electronic signature',
      externalMessage: 'PDF inválido para solicitação de assinatura',
      context,
    });
  }
}
