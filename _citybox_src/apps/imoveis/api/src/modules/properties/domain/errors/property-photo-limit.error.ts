import { DomainError } from '../../../../shared/core/errors/domain.error';

export class PropertyPhotoLimitError extends DomainError {
  constructor(context: string, max: number) {
    super({
      internalMessage: `Property photo limit reached (${max})`,
      externalMessage: `Limite de ${max} fotos por imóvel`,
      context,
    });
  }
}
