import { DomainError } from '../../../../shared/core/errors/domain.error';

export class BranchNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Branch ${id} not found in the current organization`,
      externalMessage: 'Unidade não encontrada',
      context: BranchNotFoundError.name,
    });
  }
}
