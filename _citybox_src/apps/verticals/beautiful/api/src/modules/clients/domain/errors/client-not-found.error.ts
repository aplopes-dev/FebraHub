import { DomainError } from '../../../../shared/core/errors/domain.error';

export class ClientNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Client with ID "${id}" was not found.`,
      externalMessage: 'Cliente não encontrado.',
      context: 'Clients',
    });
  }
}
