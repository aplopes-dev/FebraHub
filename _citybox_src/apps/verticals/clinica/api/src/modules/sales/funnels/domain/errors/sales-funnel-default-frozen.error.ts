import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class SalesFunnelDefaultFrozenError extends DomainError {
  constructor(context: string, id: string) {
    super({
      internalMessage: `Cannot delete default sales funnel: ${id}`,
      externalMessage: 'Funil padrão não pode ser excluído',
      context,
    });
  }
}
