import { DomainError } from '../../../../shared/core/errors/domain.error';

export class CustomerDocumentTakenError extends DomainError {
  constructor(document: string, deleted = false) {
    super({
      internalMessage: `Customer document ${document} already used in this organization${deleted ? ' (deleted customer)' : ''}`,
      externalMessage: deleted
        ? 'Existe um cliente excluído com este CNPJ/CPF. Restaure-o ou use outro documento.'
        : 'Já existe um cliente com este CNPJ/CPF nesta organização',
      context: CustomerDocumentTakenError.name,
    });
  }
}
