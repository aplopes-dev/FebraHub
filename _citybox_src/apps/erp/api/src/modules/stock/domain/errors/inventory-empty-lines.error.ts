import { DomainError } from '../../../../shared/core/errors/domain.error';

export class InventoryEmptyLinesError extends DomainError {
  constructor() {
    super({
      internalMessage: 'Inventory create attempted without lines',
      externalMessage: 'Informe ao menos um produto na contagem.',
      context: InventoryEmptyLinesError.name,
    });
  }
}
