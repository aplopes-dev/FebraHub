import { DomainError } from '../../../../shared/core/errors/domain.error';

type StockNotRemovableReason = 'default' | 'hasMovements' | 'hasDependents';

const MESSAGES: Record<
  StockNotRemovableReason,
  { internal: (id: string) => string; external: string }
> = {
  default: {
    internal: (id) => `Stock ${id} is the default warehouse and cannot be deleted`,
    external: 'Estoque padrão da operação não pode ser excluído.',
  },
  hasMovements: {
    internal: (id) => `Stock ${id} has movements or balance and cannot be deleted`,
    external: 'Estoque com saldo ou movimentações não pode ser excluído.',
  },
  hasDependents: {
    internal: (id) =>
      `Stock ${id} is referenced by a purchase, inventory, transfer or production order`,
    external:
      'Estoque vinculado a compras, inventários, transferências ou pedidos de produção não pode ser excluído.',
  },
};

export class StockNotRemovableError extends DomainError {
  constructor(id: string, reason: StockNotRemovableReason = 'default') {
    const message = MESSAGES[reason];
    super({
      internalMessage: message.internal(id),
      externalMessage: message.external,
      context: StockNotRemovableError.name,
    });
  }
}
