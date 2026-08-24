import { DomainError } from '../../../../shared/core/errors/domain.error';

export class ElectronicSignatureNotPendingError extends DomainError {
  constructor(context: string, signatureId: string) {
    super({
      internalMessage: `Electronic signature is not pending: ${signatureId}`,
      externalMessage: 'Esta solicitação de assinatura não está pendente',
      context,
    });
  }
}
