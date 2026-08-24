import type { Authority, ServiceStatus, StatusModel } from './service-status';

/// Resultado de uma verificação de disponibilidade, por modelo (Key Entities).
///
/// A mesma informação serve de **cache** (FR-007) e de **trilha de auditoria**
/// (FR-013) — por isso guarda a mensagem original do órgão e o instante da
/// apuração, não só a situação. Imutável: cada contato real gera uma entrada
/// nova (a tabela é append-only), a leitura pega a mais recente.
export type StatusCheck = {
  companyId: string;
  model: StatusModel;
  environment: 'HOMOLOGATION' | 'PRODUCTION';
  status: ServiceStatus;
  authority: Authority;
  /// Mensagem original do órgão, preservada literal (FR-006). `null` quando não
  /// houve resposta (UNREACHABLE) ou não se aplica.
  authorityMessage: string | null;
  /// Previsão de retorno, quando o órgão a informa (FR-006).
  expectedReturnAt: Date | null;
  /// Instante da apuração (FR-005).
  checkedAt: Date;
};

/// Chave da janela de FR-007: é nessa granularidade que o órgão conta as
/// consultas, e é a chave do advisory lock (FR-007b).
export type StatusWindowKey = {
  companyId: string;
  model: StatusModel;
  environment: 'HOMOLOGATION' | 'PRODUCTION';
};

/// Serializa a chave para o lock e para logs. Ordem fixa — o hash do lock
/// depende dela ser estável.
export function statusWindowKeyString(key: StatusWindowKey): string {
  return `${key.companyId}:${key.model}:${key.environment}`;
}
