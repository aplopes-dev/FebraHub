import { DomainError } from '../../../../shared/core/errors/domain.error';

const MESSAGES: Record<string, string> = {
  empty: 'Arquivo de imagem vazio',
  too_large: 'Imagem deve ter no máximo 4 MB',
  signature: 'Formato de imagem inválido. Use PNG, JPEG ou WebP',
  mime: 'Tipo de imagem não permitido. Use PNG, JPEG ou WebP',
  mismatch: 'O conteúdo do arquivo não corresponde ao tipo informado',
};

export class InvalidImageFileError extends DomainError {
  constructor(context: string, reason: string) {
    super({
      internalMessage: `Invalid image file (${reason})`,
      externalMessage: MESSAGES[reason] ?? 'Arquivo de imagem inválido',
      context,
    });
  }
}
