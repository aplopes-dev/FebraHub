import { InfrastructureError } from '../../../core/errors/infrastructure.error';

/// Chave ausente/malformada em `FISCAL_CERT_ENCRYPTION_KEY` — erro de configuração
/// de ambiente, não de entrada do usuário (research.md §6).
export class CertEncryptionKeyMissingError extends InfrastructureError {
  constructor(detail?: string) {
    super({
      internalMessage: detail ?? 'FISCAL_CERT_ENCRYPTION_KEY não configurada',
      externalMessage:
        'Configuração de segurança indisponível. Tente novamente mais tarde.',
      context: 'CertEncryption',
    });
  }
}

/// Decriptação falhou — chave errada (ex.: rotação de ambiente) ou payload
/// corrompido/adulterado (a tag de autenticação do GCM não confere).
export class CertDecryptionError extends InfrastructureError {
  constructor(detail: string) {
    super({
      internalMessage: `Falha ao decriptar segredo do certificado: ${detail}`,
      externalMessage: 'Não foi possível processar o certificado digital.',
      context: 'CertEncryption',
    });
  }
}
