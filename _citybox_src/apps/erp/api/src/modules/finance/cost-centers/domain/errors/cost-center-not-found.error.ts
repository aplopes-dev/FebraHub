import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class CostCenterNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Cost center ${id} not found in the current organization`,
      externalMessage: 'Centro de custo não encontrado',
      context: CostCenterNotFoundError.name,
    });
  }
}
