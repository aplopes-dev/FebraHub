import { DomainError } from '../../../../shared/core/errors/domain.error';

export class PropertyPhotoOrderError extends DomainError {
  constructor(context: string) {
    super({
      internalMessage: 'Property photo order is not a permutation of current photos',
      externalMessage:
        'A ordem das fotos deve incluir todas as fotos atuais, sem repetir nem omitir',
      context,
    });
  }
}
