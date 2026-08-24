import { DomainError } from '../../../../shared/core/errors/domain.error';

export class UnitOfMeasureNotRemovableError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `UnitOfMeasure ${id} is provisioned by the system and cannot be deleted`,
      externalMessage: 'Unidades de medida do sistema não podem ser excluídas.',
      context: UnitOfMeasureNotRemovableError.name,
    });
  }
}
