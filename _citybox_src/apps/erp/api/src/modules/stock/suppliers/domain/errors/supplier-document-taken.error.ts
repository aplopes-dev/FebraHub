import { DomainError } from '../../../../../shared/core/errors/domain.error';

/**
 * Escopado à organização de propósito: um unique global responderia 409 para um
 * CNPJ cadastrado por outra empresa, revelando tanto a existência daquele
 * tenant quanto de quem ele compra (mesma razão de `BranchDocumentTakenError`).
 */
export class SupplierDocumentTakenError extends DomainError {
  constructor(document: string, deleted = false) {
    super({
      internalMessage: `Supplier document ${document} already used in this organization${deleted ? ' (deleted supplier)' : ''}`,
      externalMessage: deleted
        ? 'Existe um fornecedor excluído com este CNPJ/CPF. Restaure-o ou use outro documento.'
        : 'Já existe um fornecedor com este CNPJ/CPF nesta organização',
      context: SupplierDocumentTakenError.name,
    });
  }
}
