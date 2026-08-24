import { DomainError } from '../../../../shared/core/errors/domain.error';

export class PropertyPhotoNotFoundError extends DomainError {
  constructor(context: string, photoId: string) {
    super({
      internalMessage: `Property photo not found: ${photoId}`,
      externalMessage: 'Foto do imóvel não encontrada',
      context,
    });
  }
}
