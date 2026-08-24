import type { MunicipalParameters } from '../entities/municipal-parameters.entity';

/// Motivo pelo qual a substituição não pode prosseguir. `null` = pode.
///
/// Enumerado em vez de booleano porque cada recusa exige uma ação diferente do
/// operador: informar o tomador é algo que ele resolve, prazo vencido não é, e
/// bloqueio de ofício exige falar com o município. Um `false` não diria qual.
export type SubstitutionBlocker =
  | 'DEADLINE_EXPIRED'
  | 'CUSTOMER_REQUIRED'
  | 'FISCAL_ANALYSIS_PENDING'
  | 'OFFICIAL_BLOCK';

export type SubstitutionEligibilityInput = {
  authorizedAt: Date;
  now: Date;
  /// `null` quando a parametrização não pôde ser resolvida.
  parameters: MunicipalParameters | null;
  /// A nota original identifica o tomador (CPF/CNPJ)?
  hasCustomerIdentification: boolean;
  /// Existe pedido de análise fiscal ainda sem julgamento para esta nota?
  hasPendingFiscalAnalysis: boolean;
  /// Município aplicou bloqueio de ofício sobre a nota.
  hasOfficialBlock: boolean;
};

/// FR-013 — decide se a NFS-e pode ser substituída, devolvendo o **primeiro**
/// impedimento encontrado ou `null`.
///
/// Ordem deliberada: bloqueios que o operador não resolve sozinho vêm antes dos
/// que ele resolve. Reportar "informe o tomador" para uma nota sob bloqueio de
/// ofício o faria preencher dados e tentar de novo para nada.
export function resolveSubstitutionBlocker(
  input: SubstitutionEligibilityInput,
): SubstitutionBlocker | null {
  if (input.hasOfficialBlock) return 'OFFICIAL_BLOCK';
  if (input.hasPendingFiscalAnalysis) return 'FISCAL_ANALYSIS_PENDING';

  // ⚠️ Regra REVISADA em 2026-08-07 por decisão de negócio.
  //
  // Antes bloqueava quando o município não publicava prazo. Mas a
  // parametrização REAL de Ilhéus (`/convenio`) não publica prazo nenhum —
  // devolve adesão e crédito. O efeito não era um bloqueio conservador: era
  // substituição permanentemente indisponível.
  //
  // Agora **quem decide é o Sefin**, que conhece a janela e recusa o evento
  // `e105102` fora dela. O risco assumido — nota nova emitida e evento
  // recusado, deixando duas vivas — é tratado em `SubstituteNfseUseCase` com
  // cancelamento compensatório da substituta.
  //
  // Prazo PUBLICADO e vencido continua bloqueando aqui: nesse caso não falta
  // informação, a informação diz que não pode, e transmitir gastaria uma
  // numeração para receber recusa previsível.
  const deadlineDays = input.parameters?.substitutionDeadlineDays ?? null;
  if (
    deadlineDays !== null &&
    deadlineDays > 0 &&
    elapsedCalendarDays(input.authorizedAt, input.now) > deadlineDays
  ) {
    return 'DEADLINE_EXPIRED';
  }

  if (
    input.parameters?.requiresCustomerForSubstitution &&
    !input.hasCustomerIdentification
  ) {
    return 'CUSTOMER_REQUIRED';
  }

  return null;
}

/// Mesma contagem de `nfse-cancel-path.ts`: dias de calendário no fuso de
/// Brasília, não múltiplos de 24h. Duplicada de propósito? Não — se um terceiro
/// prazo aparecer, extrair para um módulo compartilhado; com dois, a extração
/// ainda não paga o acoplamento.
function elapsedCalendarDays(from: Date, to: Date): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const BRASILIA_OFFSET_MS = -3 * 60 * 60 * 1000;
  const dayIndex = (date: Date): number =>
    Math.floor((date.getTime() + BRASILIA_OFFSET_MS) / MS_PER_DAY);
  return dayIndex(to) - dayIndex(from);
}
