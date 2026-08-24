import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class SalesFunnelNotFoundError extends DomainError {
  constructor(context: string, id: string) {
    super({
      internalMessage: `Sales funnel not found: ${id}`,
      externalMessage: 'Funil não encontrado',
      context,
    });
  }
}
