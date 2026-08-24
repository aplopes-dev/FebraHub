import { DomainError } from '../../../../../shared/core/errors/domain.error';

/**
 * Escopado à organização de propósito: um unique global responderia 409 para um
 * CNPJ cadastrado por outra empresa, revelando tanto a existência daquele
 * tenant quanto de quem ele contrata para entregar (mesma razão de
 * `SupplierDocumentTakenError`).
 */
export class CarrierDocumentTakenError extends DomainError {
  constructor(document: string, deleted = false) {
    super({
      internalMessage: `Carrier document ${document} already used in this organization${deleted ? ' (deleted carrier)' : ''}`,
      externalMessage: deleted
        ? 'Existe uma transportadora excluída com este CNPJ/CPF. Restaure-a ou use outro documento.'
        : 'Já existe uma transportadora com este CNPJ/CPF nesta organização',
      context: CarrierDocumentTakenError.name,
    });
  }
}
