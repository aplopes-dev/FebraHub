/// Situação de disponibilidade de um órgão fiscal para um modelo (FR-002).
///
/// A distinção que dá razão a esta feature está aqui: `DOWN` e `UNREACHABLE`
/// **não são sinônimos**. `DOWN` é o órgão dizendo que está fora; `UNREACHABLE`
/// é não termos obtido resposta — o que pode ser problema nosso (rede,
/// certificado, DNS). Tratar a segunda como a primeira é o erro de diagnóstico
/// que motivou a feature.
export type ServiceStatus =
  /// O órgão respondeu que está em operação.
  | 'OPERATIONAL'
  /// O órgão respondeu **declarando** indisponibilidade/manutenção.
  | 'DOWN'
  /// Não houve resposta dentro do tempo limite, ou falha de transporte.
  | 'UNREACHABLE'
  /// Aquele órgão não oferece forma de perguntar disponibilidade (NFS-e hoje).
  | 'UNVERIFIABLE'
  /// Falha do nosso lado impediu a pergunta (certificado ausente/vencido).
  | 'LOCAL_ERROR';

/// Modelos que o serviço emite e para os quais se pode perguntar status.
export type StatusModel = 'NFE' | 'NFCE' | 'NFSE';

/// Órgão efetivamente consultado (FR-004). Varia por modelo mesmo dentro do
/// mesmo estado — na Bahia, NF-e é a SEFAZ estadual e NFC-e é o SVRS.
export type Authority = 'SEFAZ-BA' | 'SVRS' | 'SEFIN-NACIONAL';

/// Veredito de topo (FR-001b): resume o conjunto sem substituir o detalhe por
/// modelo. `HAS_PROBLEM` cobre qualquer situação acionável; `INCONCLUSIVE`
/// distingue "não há problema, mas também não deu para confirmar tudo".
export type OverallVerdict = 'ALL_OPERATIONAL' | 'HAS_PROBLEM' | 'INCONCLUSIVE';

/// Situações que representam um problema acionável — de qualquer lado.
const PROBLEM_STATUSES: ReadonlySet<ServiceStatus> = new Set([
  'DOWN',
  'UNREACHABLE',
  'LOCAL_ERROR',
]);

/// Deriva o veredito de topo a partir das situações por modelo (FR-001b).
///
/// Regras, em ordem:
/// - Qualquer problema (`DOWN`/`UNREACHABLE`/`LOCAL_ERROR`) → `HAS_PROBLEM`.
///   Um problema em qualquer modelo é o que interessa a quem consulta.
/// - Sem problema, mas há `UNVERIFIABLE` → `INCONCLUSIVE`. Não afirmamos "tudo
///   certo" quando um modelo não pôde nem ser perguntado (FR-003 no atacado).
/// - Todos `OPERATIONAL` → `ALL_OPERATIONAL`.
export function deriveOverallVerdict(
  statuses: readonly ServiceStatus[],
): OverallVerdict {
  if (statuses.some((status) => PROBLEM_STATUSES.has(status))) {
    return 'HAS_PROBLEM';
  }
  if (statuses.some((status) => status === 'UNVERIFIABLE')) {
    return 'INCONCLUSIVE';
  }
  return 'ALL_OPERATIONAL';
}
