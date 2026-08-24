import { DomainError } from '../../../../shared/core/errors/domain.error';

export class InventoryNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Inventory ${id} not found in the current organization`,
      externalMessage: 'Inventário não encontrado',
      context: InventoryNotFoundError.name,
    });
  }
}
