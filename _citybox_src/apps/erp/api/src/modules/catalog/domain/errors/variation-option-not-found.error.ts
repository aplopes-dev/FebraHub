import { DomainError } from '../../../../shared/core/errors/domain.error';

export class VariationOptionNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `VariationOption ${id} not found`,
      externalMessage: 'Opção de variação não encontrada',
      context: VariationOptionNotFoundError.name,
    });
  }
}
