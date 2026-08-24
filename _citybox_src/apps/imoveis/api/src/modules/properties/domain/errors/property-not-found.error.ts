import { DomainError } from '../../../../shared/core/errors/domain.error';

export class PropertyNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Property not found: id=${id}`,
      externalMessage: 'Imóvel não encontrado.',
      context: 'PropertyNotFoundError',
    });
  }
}
