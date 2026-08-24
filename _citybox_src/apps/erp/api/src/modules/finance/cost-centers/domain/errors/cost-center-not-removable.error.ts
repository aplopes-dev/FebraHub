import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class CostCenterNotRemovableError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `CostCenter ${id} is provisioned by the system and cannot be deleted`,
      externalMessage: 'Centros de custo do sistema não podem ser excluídos.',
      context: CostCenterNotRemovableError.name,
    });
  }
}
