import { DomainError } from '../../../../shared/core/errors/domain.error';

export class CustomerNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Customer ${id} not found in the current organization`,
      externalMessage: 'Cliente não encontrado',
      context: CustomerNotFoundError.name,
    });
  }
}
