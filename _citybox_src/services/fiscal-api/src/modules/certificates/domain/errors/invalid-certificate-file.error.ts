import { DomainError } from '../../../../shared/core/errors/domain.error';

const MESSAGES: Record<string, string> = {
  empty: 'Arquivo vazio',
  too_large: `Certificado deve ter no máximo 10 MB`,
  signature:
    'Formato de arquivo inválido — envie um certificado PKCS#12 (.pfx/.p12)',
  extension: 'Extensão do arquivo deve ser .pfx ou .p12',
};

export class InvalidCertificateFileError extends DomainError {
  constructor(context: string, reason: string) {
    super({
      internalMessage: `Invalid certificate file (${reason})`,
      externalMessage: MESSAGES[reason] ?? 'Arquivo de certificado inválido',
      context,
    });
  }
}
