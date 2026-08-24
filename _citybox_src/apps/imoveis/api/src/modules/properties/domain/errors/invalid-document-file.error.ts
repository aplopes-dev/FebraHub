import { DomainError } from '../../../../shared/core/errors/domain.error';

const MESSAGES: Record<string, string> = {
  empty: 'Arquivo vazio',
  too_large: 'Documento deve ter no máximo 15 MB',
  signature: 'Formato de documento inválido. Use PDF, DOC ou DOCX',
  extension: 'Extensão do arquivo não corresponde ao conteúdo enviado',
  name: 'Nome do arquivo inválido',
};

export class InvalidDocumentFileError extends DomainError {
  constructor(context: string, reason: string) {
    super({
      internalMessage: `Invalid document file (${reason})`,
      externalMessage: MESSAGES[reason] ?? 'Arquivo de documento inválido',
      context,
    });
  }
}
