import { DomainError } from '../../../../shared/core/errors/domain.error';

export class StockSupplierNotFoundError extends DomainError {
  constructor(context: string, id: string) {
    super({
      internalMessage: `Stock supplier not found: ${id}`,
      externalMessage: 'Fornecedor não encontrado',
      context,
    });
  }
}
