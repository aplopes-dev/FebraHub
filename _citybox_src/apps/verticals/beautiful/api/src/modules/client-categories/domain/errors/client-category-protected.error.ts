import { DomainError } from '../../../../shared/core/errors/domain.error';

export class ClientCategoryProtectedError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Client category is protected: ${id}`,
      externalMessage: 'Esta categoria protegida não pode ser excluída.',
      context: 'ClientCategory',
    });
  }
}
