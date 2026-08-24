import { DomainError } from '../../../../shared/core/errors/domain.error';

export class ElectronicSignatureNotFoundError extends DomainError {
  constructor(context: string, signatureId: string) {
    super({
      internalMessage: `Electronic signature not found: ${signatureId}`,
      externalMessage: 'Solicitação de assinatura não encontrada',
      context,
    });
  }
}
