import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class FinancialGroupNotRemovableError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `FinancialGroup ${id} is provisioned by the system and cannot be deleted`,
      externalMessage: 'Grupos financeiros do sistema não podem ser excluídos.',
      context: FinancialGroupNotRemovableError.name,
    });
  }
}
