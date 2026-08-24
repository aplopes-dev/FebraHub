import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class SupplierNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Supplier ${id} not found in the current organization`,
      externalMessage: 'Fornecedor não encontrado',
      context: SupplierNotFoundError.name,
    });
  }
}
