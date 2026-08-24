import { DomainError } from '../../../../../shared/core/errors/domain.error';

const MESSAGES: Record<string, string> = {
  empty: 'Arquivo vazio',
  too_large: 'O arquivo deve ter no máximo 20 MB',
  mime: 'Tipo de arquivo não permitido. Envie imagem, PDF, Word, Excel ou texto',
};

export class InvalidPatientFileError extends DomainError {
  constructor(context: string, reason: string) {
    super({
      internalMessage: `Invalid patient file (${reason})`,
      externalMessage: MESSAGES[reason] ?? 'Arquivo inválido',
      context,
    });
  }
}
