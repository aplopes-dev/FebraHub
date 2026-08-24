import { DomainError } from '../../../../shared/core/errors/domain.error';

export class InvalidImageFileError extends DomainError {
  constructor(context: string, reason: string) {
    super({
      internalMessage: `Invalid image file (${reason})`,
      externalMessage:
        reason === 'too_large'
          ? 'A imagem deve ter no máximo 4 MB.'
          : 'Arquivo de imagem inválido. Use PNG, JPEG ou WebP.',
      context,
    });
  }
}
