import { DomainError } from '../../../../shared/core/errors/domain.error';

export class ContractModelIsDefaultError extends DomainError {
  constructor(context: string, id: string) {
    super({
      internalMessage: `ContractModel "${id}" is the default model and cannot be deleted`,
      externalMessage: 'O modelo padrão não pode ser excluído',
      context,
    });
  }
}
