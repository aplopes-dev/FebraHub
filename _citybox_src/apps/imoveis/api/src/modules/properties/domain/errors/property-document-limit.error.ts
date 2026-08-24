import { DomainError } from '../../../../shared/core/errors/domain.error';

export class PropertyDocumentLimitError extends DomainError {
  constructor(context: string, max: number) {
    super({
      internalMessage: `Property document limit reached (${max})`,
      externalMessage: `Limite de ${max} documentos por imóvel`,
      context,
    });
  }
}
