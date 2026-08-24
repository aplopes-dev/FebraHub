import { DomainError } from '../../../../shared/core/errors/domain.error';

export class SignaturePackageRequestNotPendingError extends DomainError {
  constructor(context: string, id: string) {
    super({
      internalMessage: `SignaturePackageRequest "${id}" is not pending`,
      externalMessage: 'Esta solicitação não está mais pendente',
      context,
    });
  }
}
