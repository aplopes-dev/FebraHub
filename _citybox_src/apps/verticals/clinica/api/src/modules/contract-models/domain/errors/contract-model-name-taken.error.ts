import { DomainError } from '../../../../shared/core/errors/domain.error';

export class ContractModelNameTakenError extends DomainError {
  constructor(context: string, name: string) {
    super({
      internalMessage: `ContractModel name "${name}" already exists for store`,
      externalMessage: 'Já existe um modelo de contrato com esse nome',
      context,
    });
  }
}
