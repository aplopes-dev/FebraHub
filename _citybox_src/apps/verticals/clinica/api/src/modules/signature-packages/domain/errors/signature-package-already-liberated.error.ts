import { DomainError } from '../../../../shared/core/errors/domain.error';

export class SignaturePackageAlreadyLiberatedError extends DomainError {
  constructor(context: string, id: string) {
    super({
      internalMessage: `SignaturePackageRequest "${id}" is already liberated`,
      externalMessage: 'Solicitação de pacote já foi liberada',
      context,
    });
  }
}
