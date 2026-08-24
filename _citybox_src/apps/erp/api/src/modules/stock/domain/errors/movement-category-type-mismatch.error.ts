import { DomainError } from '../../../../shared/core/errors/domain.error';

export class MovementCategoryTypeMismatchError extends DomainError {
  constructor() {
    super({
      internalMessage: 'Movement category type does not match movement type',
      externalMessage:
        'A categoria selecionada não corresponde ao tipo da movimentação.',
      context: MovementCategoryTypeMismatchError.name,
    });
  }
}
