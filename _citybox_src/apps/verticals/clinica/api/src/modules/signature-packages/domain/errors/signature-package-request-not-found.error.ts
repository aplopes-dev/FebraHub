import { DomainError } from '../../../../shared/core/errors/domain.error';

export class SignaturePackageRequestNotFoundError extends DomainError {
  constructor(context: string, id: string) {
    super({
      internalMessage: `SignaturePackageRequest "${id}" not found for store`,
      externalMessage: 'Solicitação de pacote de assinatura não encontrada',
      context,
    });
  }
}
