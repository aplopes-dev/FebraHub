import { DomainError } from '../../../../shared/core/errors/domain.error';

export class ContractModelNotFoundError extends DomainError {
  constructor(context: string, id: string) {
    super({
      internalMessage: `ContractModel "${id}" not found for store`,
      externalMessage: 'Modelo de contrato não encontrado',
      context,
    });
  }
}
