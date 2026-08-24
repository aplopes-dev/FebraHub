import { DomainError } from '../../../../shared/core/errors/domain.error';

export class ClientCategoryNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `ClientCategory not found: ${id}`,
      externalMessage: 'Categoria de cliente não encontrada.',
      context: 'ClientCategories',
    });
  }
}
