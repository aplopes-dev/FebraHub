import { InvalidStatementPeriodError } from '../errors/invalid-statement-period.error';

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Confere que um intervalo de data (competência **ou** vencimento) não vem
 * invertido antes de qualquer query — edge case do extrato ("Período
 * informado com data final anterior à inicial"). Só rejeita quando os dois
 * lados vêm preenchidos; um lado sozinho é um filtro aberto válido.
 */
export function assertValidPeriodRange(from?: Date, to?: Date): void {
  if (!from || !to) return;
  if (to.getTime() < from.getTime()) {
    throw new InvalidStatementPeriodError(toIsoDate(from), toIsoDate(to));
  }
}
