import type {
  Authority,
  OverallVerdict,
  ServiceStatus,
  StatusModel,
} from './service-status';

/// Situação de um modelo na resposta da consulta (FR-002, FR-004, FR-005).
export type ModelStatus = {
  model: StatusModel;
  authority: Authority;
  status: ServiceStatus;
  authorityMessage: string | null;
  expectedReturnAt: Date | null;
  checkedAt: Date;
  /// Idade do dado em segundos (FR-005). 0 = recém-verificado.
  ageSeconds: number;
  /// Quando haverá nova verificação (FR-005). `null` para `UNVERIFIABLE`.
  nextCheckAt: Date | null;
};

/// Resposta completa da consulta (FR-001b): veredito de topo + detalhe por
/// modelo.
export type StatusResponse = {
  overall: OverallVerdict;
  checkedForCompanyId: string;
  environment: 'HOMOLOGATION' | 'PRODUCTION';
  results: ModelStatus[];
};
