import { ValidatorDomainError } from '../../../core/errors/validator-domain.error';

/// Mapeia para 422 via AppExceptionFilter — falha no upload de um certificado
/// (arquivo inválido, senha incorreta) é entrada do usuário, não erro de infra
/// (US3 Acceptance Scenario 2, SC-006).
export class Pkcs12ParseError extends ValidatorDomainError {
  constructor(reason: string) {
    super({
      internalMessage: `PKCS#12 parse failed: ${reason}`,
      externalMessage: `Certificado inválido: ${reason}`,
      context: 'Pkcs12Parser',
    });
  }
}
