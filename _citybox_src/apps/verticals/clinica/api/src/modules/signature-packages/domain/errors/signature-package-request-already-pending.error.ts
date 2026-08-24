import { DomainError } from '../../../../shared/core/errors/domain.error';

export class SignaturePackageRequestAlreadyPendingError extends DomainError {
  constructor(context: string, packageId: string) {
    super({
      internalMessage: `Signature package "${packageId}" already has a pending request`,
      externalMessage:
        'Já existe uma solicitação pendente para este pacote. Aguarde a liberação ou o cancelamento no admin.',
      context,
    });
  }
}
