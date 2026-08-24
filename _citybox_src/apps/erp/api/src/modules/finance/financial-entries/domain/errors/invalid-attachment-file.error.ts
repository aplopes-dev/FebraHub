import { DomainError } from '../../../../../shared/core/errors/domain.error';

const MESSAGES: Record<string, string> = {
  empty: 'Arquivo vazio',
  too_large: 'Arquivo deve ter no máximo 5 MB',
  signature: 'Formato de arquivo inválido. Use PDF, PNG, JPEG ou WebP',
  mime: 'Tipo de arquivo não permitido. Use PDF, PNG, JPEG ou WebP',
  mismatch: 'O conteúdo do arquivo não corresponde ao tipo informado',
};

export class InvalidAttachmentFileError extends DomainError {
  constructor(context: string, reason: string) {
    super({
      internalMessage: `Invalid financial entry attachment file (${reason})`,
      externalMessage: MESSAGES[reason] ?? 'Arquivo inválido',
      context,
    });
  }
}
