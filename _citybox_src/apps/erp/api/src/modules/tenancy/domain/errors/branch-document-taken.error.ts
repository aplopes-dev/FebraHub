import { DomainError } from '../../../../shared/core/errors/domain.error';

/**
 * Escopado à organização de propósito: um unique global responderia 409 para um
 * CNPJ cadastrado por outra empresa, revelando a existência daquele tenant.
 */
export class BranchDocumentTakenError extends DomainError {
  constructor(document: string, deactivated = false) {
    super({
      internalMessage: `Branch document ${document} already used in this organization${deactivated ? ' (deactivated branch)' : ''}`,
      externalMessage: deactivated
        ? 'Existe uma unidade desativada com este CNPJ/CPF. Reative-a ou use outro documento.'
        : 'Já existe uma unidade com este CNPJ/CPF nesta organização',
      context: BranchDocumentTakenError.name,
    });
  }
}
