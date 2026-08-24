import { DomainError } from '../../../../shared/core/errors/domain.error';

export class VariationNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Variation ${id} not found`,
      externalMessage: 'Variação não encontrada',
      context: VariationNotFoundError.name,
    });
  }
}
