import { DomainError } from '../../../../shared/core/errors/domain.error';

export class OperationNatureNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `OperationNature ${id} not found`,
      externalMessage: 'Natureza de operação não encontrada.',
      context: OperationNatureNotFoundError.name,
    });
  }
}
