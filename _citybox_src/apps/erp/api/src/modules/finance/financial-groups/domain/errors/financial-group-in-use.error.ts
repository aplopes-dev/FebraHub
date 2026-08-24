import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class FinancialGroupInUseError extends DomainError {
  constructor(name: string, chartOfAccountCount: number) {
    super({
      internalMessage: `Financial group ${name} has ${chartOfAccountCount} active chart of accounts`,
      externalMessage: `O grupo "${name}" possui ${chartOfAccountCount} conta(s) do plano de contas vinculada(s) e não pode ser excluído`,
      context: FinancialGroupInUseError.name,
    });
  }
}
