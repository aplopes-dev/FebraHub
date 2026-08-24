import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class CarrierNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Carrier ${id} not found in the current organization`,
      externalMessage: 'Transportadora não encontrada',
      context: CarrierNotFoundError.name,
    });
  }
}
