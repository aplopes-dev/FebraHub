import type { MunicipalParameters } from '../entities/municipal-parameters.entity';

/// Caminho pelo qual o cancelamento será registrado no Padrão Nacional.
///
/// `DIRECT` gera o evento `e101101` (cancelamento); `FISCAL_ANALYSIS` gera o
/// `e101103` (solicitação de análise fiscal), que o município julga. Quem pede
/// o cancelamento não escolhe entre os dois — pede cancelar, e a regra decide.
export type CancelPath = 'DIRECT' | 'FISCAL_ANALYSIS';

export type ResolveCancelPathInput = {
  authorizedAt: Date;
  now: Date;
  /// `null` quando a parametrização não pôde ser resolvida.
  parameters: MunicipalParameters | null;
};

/// FR-012 — decide entre cancelamento direto e análise fiscal a partir do prazo
/// **publicado pelo município**, nunca de constante no código: dois municípios
/// com prazos distintos precisam divergir para o mesmo intervalo decorrido.
///
/// Sem prazo publicado (município não parametrizou, ou a consulta falhou), o
/// caminho é análise fiscal. Não é o mesmo que recusar: é o caminho que sempre
/// existe. Assumir um prazo arriscaria pedir cancelamento direto fora da janela
/// — que o município recusa, e aí o operador fica sem saída nenhuma.
export function resolveCancelPath(input: ResolveCancelPathInput): CancelPath {
  const deadlineDays = input.parameters?.cancelDeadlineDays ?? null;
  if (deadlineDays === null || deadlineDays <= 0) return 'FISCAL_ANALYSIS';

  return elapsedCalendarDays(input.authorizedAt, input.now) <= deadlineDays
    ? 'DIRECT'
    : 'FISCAL_ANALYSIS';
}

/// Prazo fiscal se conta em dias, não em múltiplos de 24 horas: uma nota
/// autorizada às 23h consome o primeiro dia inteiro. Contar por diferença de
/// milissegundos daria a ela quase um dia a mais que a autorizada às 00h30 do
/// mesmo dia.
///
/// Normaliza no fuso de Brasília (UTC-3) — o mesmo em que os prazos municipais
/// são publicados. Usar o fuso do processo faria o resultado depender de onde o
/// servidor roda.
function elapsedCalendarDays(from: Date, to: Date): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const BRASILIA_OFFSET_MS = -3 * 60 * 60 * 1000;

  const dayIndex = (date: Date): number =>
    Math.floor((date.getTime() + BRASILIA_OFFSET_MS) / MS_PER_DAY);

  return dayIndex(to) - dayIndex(from);
}
