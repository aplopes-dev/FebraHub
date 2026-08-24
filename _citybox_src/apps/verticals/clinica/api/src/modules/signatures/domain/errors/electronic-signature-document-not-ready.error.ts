import { DomainError } from '../../../../shared/core/errors/domain.error';

export class ElectronicSignatureDocumentNotReadyError extends DomainError {
  constructor(context: string, reason: string) {
    super({
      internalMessage: `Document not ready for signature: ${reason}`,
      externalMessage: reason,
      context,
    });
  }
}
