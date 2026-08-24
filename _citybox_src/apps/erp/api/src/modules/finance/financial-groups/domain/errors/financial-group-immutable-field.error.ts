import { DomainError } from '../../../../../shared/core/errors/domain.error';

/**
 * O tipo (receita/despesa) de um grupo de sistema é referenciado por regras da
 * aplicação; renomear é permitido, mudar o tipo quebraria os lançamentos.
 */
export class FinancialGroupImmutableFieldError extends DomainError {
  constructor(id: string, field: string) {
    super({
      internalMessage: `FinancialGroup ${id} is a system group; field "${field}" cannot be changed`,
      externalMessage:
        'Não é possível alterar o tipo de um grupo financeiro do sistema.',
      context: FinancialGroupImmutableFieldError.name,
    });
  }
}
