import { DomainError } from '../../../../shared/core/errors/domain.error';

export class FiscalGroupNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `FiscalGroup ${id} not found`,
      externalMessage: 'Grupo fiscal não encontrado.',
      context: FiscalGroupNotFoundError.name,
    });
  }
}
