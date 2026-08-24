import { DomainError } from '../../../../shared/core/errors/domain.error';

export class PropertyUnavailableError extends DomainError {
  constructor(propertyId: string, status: string) {
    super({
      internalMessage: `Property unavailable for transaction: id=${propertyId} status=${status}`,
      externalMessage:
        'Este imóvel não está disponível para novos negócios. Escolha outro ou reative o cadastro.',
      context: 'PropertyUnavailableError',
    });
  }
}
