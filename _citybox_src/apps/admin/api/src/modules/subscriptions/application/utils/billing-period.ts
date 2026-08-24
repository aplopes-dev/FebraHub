import type { SubscriptionCycle } from '../../domain/entities/subscription.entity';

export interface BillingPeriod {
  periodStart: Date;
  periodEnd: Date;
}

/**
 * Calcula o período de cobrança (periodStart e periodEnd) com base no dia de
 * vencimento definido pelo usuário (dayOfMonth) e no ciclo de cobrança.
 *
 * Regra:
 * - periodStart = data de referência (geralmente agora)
 * - periodEnd = próxima ocorrência de dayOfMonth no próximo mês
 *
 * Exemplos (referência = 14/jul, dayOfMonth = 5):
 *   → periodEnd = 5/ago
 *
 * Exemplos (referência = 3/jul, dayOfMonth = 5):
 *   → periodEnd = 5/ago
 *
 * Exemplos (referência = 5/jul, dayOfMonth = 5):
 *   → periodEnd = 5/ago
 */
export function calculateBillingPeriod(
  referenceDate: Date,
  dayOfMonth: number,
  cycle: SubscriptionCycle,
): BillingPeriod {
  const periodStart = new Date(referenceDate);
  const periodEnd = calculateNextDueDate(referenceDate, dayOfMonth, cycle);

  return { periodStart, periodEnd };
}

/**
 * Calcula a próxima data de vencimento (dueDate) — sempre o dia de vencimento
 * no próximo mês (MONTHLY) ou no próximo ano (YEARLY).
 *
 * O dayOfMonth é clamped para o último dia do mês de destino
 * (ex: dia 31 em fevereiro → 28/29).
 */
function calculateNextDueDate(
  referenceDate: Date,
  dayOfMonth: number,
  cycle: SubscriptionCycle,
): Date {
  const due = new Date(referenceDate);

  const targetMonth = cycle === 'MONTHLY' ? due.getMonth() + 1 : due.getMonth();
  const targetYear =
    cycle === 'MONTHLY' ? due.getFullYear() : due.getFullYear() + 1;
  const maxDay = new Date(targetYear, targetMonth + 1, 0).getDate();

  due.setFullYear(targetYear, targetMonth, Math.min(dayOfMonth, maxDay));

  // Zera horário para comparar apenas datas
  due.setHours(0, 0, 0, 0);

  return due;
}
