import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class SalesLabelNotFoundError extends DomainError {
  constructor(context: string, id: string) {
    super({
      internalMessage: `Sales label not found: ${id}`,
      externalMessage: 'Rótulo não encontrado',
      context,
    });
  }
}
