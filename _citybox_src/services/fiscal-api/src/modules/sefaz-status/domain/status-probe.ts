import type { Authority, ServiceStatus, StatusModel } from './service-status';

/// Resultado de um contato (ou tentativa de contato) com o órgão para um
/// modelo. É o que o caso de uso persiste e transforma na resposta HTTP.
export type ProbeResult = {
  status: ServiceStatus;
  authority: Authority;
  /// Mensagem original do órgão (FR-006), ou `null` quando não houve resposta.
  authorityMessage: string | null;
  /// Previsão de retorno quando o órgão informa (FR-006).
  expectedReturnAt: Date | null;
};

export type ProbeInput = {
  companyId: string;
  model: StatusModel;
  environment: 'HOMOLOGATION' | 'PRODUCTION';
};

/// Porta de sondagem de disponibilidade de um órgão, por modelo. O caso de uso
/// tem um `StatusProbe` por modelo (SEFAZ para NF-e/NFC-e; Sistema Nacional
/// para NFS-e). Implementações em `infrastructure/`.
///
/// ⚠️ Contrato de robustez: uma implementação **nunca** lança por
/// indisponibilidade do órgão. Falha de transporte/timeout é resultado normal
/// (`UNREACHABLE`), não exceção — o caso de uso contata vários órgãos em
/// paralelo e um inalcançável não pode derrubar os demais (FR-008a). Lançar só
/// é aceitável para erro de programação.
export abstract class StatusProbe {
  abstract probe(input: ProbeInput): Promise<ProbeResult>;

  /// Falha CEDO se o ambiente não estiver configurado, **antes** de qualquer
  /// contato (FR-009). Precisa lançar aqui (e não virar `UNREACHABLE` dentro de
  /// `probe`) porque PRODUCTION recusado não é indisponibilidade do órgão — é
  /// recusa estrutural do serviço, que deve dar 424. Deve lançar um erro cujo
  /// nome contenha `NotConfigured` (o filtro HTTP mapeia para 424).
  ///
  /// No-op por padrão: probe que não distingue ambiente não precisa fazer nada.
  assertEnvironmentAvailable(
    model: StatusModel,
    environment: 'HOMOLOGATION' | 'PRODUCTION',
  ): void {
    void model;
    void environment;
  }
}
