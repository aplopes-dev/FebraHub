import { DomainError } from '../../../../shared/core/errors/domain.error';

/** O documento é a identidade do tenant — único no sistema inteiro. */
export class OrganizationDocumentTakenError extends DomainError {
  constructor(document: string) {
    super({
      internalMessage: `Organization document ${document} already registered`,
      externalMessage: 'Já existe uma organização cadastrada com este CNPJ/CPF',
      context: OrganizationDocumentTakenError.name,
    });
  }
}
