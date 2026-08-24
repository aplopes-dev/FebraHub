import { DomainError } from '../../../../shared/core/errors/domain.error';

export class UnitOfMeasureNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `UnitOfMeasure ${id} not found`,
      externalMessage: 'Unidade de medida não encontrada',
      context: UnitOfMeasureNotFoundError.name,
    });
  }
}
