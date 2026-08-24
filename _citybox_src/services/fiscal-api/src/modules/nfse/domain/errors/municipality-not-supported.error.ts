import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';

/// Mapeia para 422 (ValidatorDomainError) — FR-020/US2 Acceptance Scenario 2:
/// município cujo emitente não está marcado como aderente ao Padrão Nacional
/// é recusado antes de qualquer tentativa de transmissão.
///
/// A mensagem interna cita o cadastro, não uma lista de municípios: quem for
/// diagnosticar precisa saber ONDE corrigir, e a correção é no cadastro da
/// empresa (`nationalNfseEnabled`), não no código.
export class MunicipalityNotSupportedError extends ValidatorDomainError {
  constructor(context: string, cityCodeIbge: string) {
    super({
      internalMessage: `Municipality ${cityCodeIbge} is not enabled for NFS-e issuance — set 'nationalNfseEnabled' on the company once the municipality has joined the national standard`,
      externalMessage: 'Município não habilitado para emissão de NFS-e',
      context,
    });
  }
}
