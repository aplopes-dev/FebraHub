import { DomainError } from '../../../../shared/core/errors/domain.error';

export class StockSupplierNameTakenError extends DomainError {
  constructor(context: string, name: string) {
    super({
      internalMessage: `Stock supplier name taken: ${name}`,
      externalMessage: 'Já existe um fornecedor com este nome',
      context,
    });
  }
}
