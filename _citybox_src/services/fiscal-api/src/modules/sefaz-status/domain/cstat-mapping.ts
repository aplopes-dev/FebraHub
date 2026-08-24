import type { ServiceStatus } from './service-status';

/// Traduz o `cStat` do retorno de `NFeStatusServico4` (`retConsStatServ`) para a
/// situação de domínio (FR-002).
///
/// Códigos do MOC (Manual de Orientação do Contribuinte), serviço de status:
/// - **107** — Serviço em Operação → `OPERATIONAL`
/// - **108** — Serviço Paralisado Momentaneamente (curto prazo) → `DOWN`
/// - **109** — Serviço Paralisado sem Previsão → `DOWN`
///
/// ⚠️ **FR-003 mora aqui.** Esta função só é chamada quando o órgão
/// **respondeu** — a ausência de resposta (timeout, erro de transporte) é
/// tratada antes, como `UNREACHABLE`, e nunca chega aqui. Por isso nenhum ramo
/// devolve `UNREACHABLE`: se chegou um `cStat`, houve resposta.
///
/// Um `cStat` fora dos conhecidos é o edge case "resposta não compreendida": o
/// órgão respondeu algo que não é "em operação", então **não** é `OPERATIONAL`
/// (converter por omissão violaria FR-003). Tratamos como `DOWN`, preservando a
/// mensagem original (FR-006) para quem for investigar.
const OPERATIONAL_CSTAT = '107';
const DOWN_CSTAT: ReadonlySet<string> = new Set(['108', '109']);

export type CstatMappingResult = {
  status: ServiceStatus;
  /// `true` quando o `cStat` não é reconhecido — sinaliza "resposta não
  /// compreendida" para log/observabilidade, sem mudar a decisão (segue `DOWN`).
  unrecognized: boolean;
};

export function mapCstatToStatus(cStat: string): CstatMappingResult {
  const code = cStat.trim();
  if (code === OPERATIONAL_CSTAT) {
    return { status: 'OPERATIONAL', unrecognized: false };
  }
  if (DOWN_CSTAT.has(code)) {
    return { status: 'DOWN', unrecognized: false };
  }
  // Órgão respondeu, mas com código inesperado. Nunca OPERATIONAL (FR-003).
  return { status: 'DOWN', unrecognized: true };
}
