import { DomainError } from '../../../../shared/core/errors/domain.error';

export class ClientCategoryDuplicateError extends DomainError {
  constructor(name: string) {
    super({
      internalMessage: `ClientCategory duplicate name: ${name}`,
      externalMessage: 'Já existe uma categoria com este nome.',
      context: 'ClientCategories',
    });
  }
}
