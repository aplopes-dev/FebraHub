import { DomainError } from '../../../../shared/core/errors/domain.error';

/// Cancelamento só se aplica a uma NFS-e com status `AUTHORIZED` — mesmo
/// raciocínio de `NfeDocumentNotAuthorizedError` (US4), espelhado aqui em
/// vez de reaproveitado para manter os erros de domínio escopados por
/// módulo (mesmo padrão já usado por `CertificateNotValidError` etc. — cada
/// módulo é dono dos seus erros mesmo quando o texto é quase idêntico).
/// Mapeia para `422` (default do `AppExceptionFilter`).
export class NfseDocumentNotAuthorizedError extends DomainError {
  constructor(
    context: string,
    fiscalDocumentId: string,
    currentStatus: string,
    operation: string,
  ) {
    super({
      internalMessage: `NFS-e "${fiscalDocumentId}" is "${currentStatus}", cannot ${operation} (requires AUTHORIZED)`,
      externalMessage: `Documento fiscal não está autorizado (status atual: ${currentStatus})`,
      context,
    });
  }
}
