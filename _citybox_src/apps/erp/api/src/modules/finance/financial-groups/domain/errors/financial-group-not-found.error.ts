import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class FinancialGroupNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Financial group ${id} not found in the current organization`,
      externalMessage: 'Grupo financeiro não encontrado',
      context: FinancialGroupNotFoundError.name,
    });
  }
}
