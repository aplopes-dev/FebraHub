import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class CustomerCategoryNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Customer category ${id} not found in the current organization`,
      externalMessage: 'Categoria de cliente não encontrada',
      context: CustomerCategoryNotFoundError.name,
    });
  }
}
