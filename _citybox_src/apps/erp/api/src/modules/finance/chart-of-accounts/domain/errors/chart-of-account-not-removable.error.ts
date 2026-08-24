import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class ChartOfAccountNotRemovableError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `ChartOfAccount ${id} is provisioned by the system and cannot be deleted`,
      externalMessage: 'Contas do sistema não podem ser excluídas.',
      context: ChartOfAccountNotRemovableError.name,
    });
  }
}
