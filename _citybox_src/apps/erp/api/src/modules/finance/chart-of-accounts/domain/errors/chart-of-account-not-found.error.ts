import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class ChartOfAccountNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Chart of account ${id} not found in the current organization`,
      externalMessage: 'Conta do plano de contas não encontrada',
      context: ChartOfAccountNotFoundError.name,
    });
  }
}
