import { DomainError } from '../../../../shared/core/errors/domain.error';

export class MovementCategoryNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `MovementCategory ${id} not found in the current organization`,
      externalMessage: 'Categoria de movimentação não encontrada',
      context: MovementCategoryNotFoundError.name,
    });
  }
}
