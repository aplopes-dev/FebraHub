import { distributeInstallmentAmounts } from './patient-budget-installment-amounts';

export type BudgetApproveInstallmentRow = {
  index: number;
  dueDate: Date;
  valueCents: number;
};

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Soma `months` em data civil local (dia 1 do mês seguinte se o dia estourar). */
export function addMonthsToLocalDate(date: Date, months: number): Date {
  const base = startOfLocalDay(date);
  const result = new Date(base.getFullYear(), base.getMonth() + months, 1);
  const day = Math.min(
    base.getDate(),
    new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate(),
  );
  return new Date(result.getFullYear(), result.getMonth(), day);
}

/**
 * Agenda inicial das parcelas: 1ª no `baseDueDate`, demais +1 mês;
 * valores rateiam `balanceCents` (resto na última).
 */
export function buildBudgetApproveInstallmentSchedule(input: {
  balanceCents: number;
  installmentsCount: number;
  baseDueDate: Date;
}): BudgetApproveInstallmentRow[] {
  const count = Math.max(0, Math.floor(input.installmentsCount));
  if (count <= 0) {
    return [];
  }

  const amounts = distributeInstallmentAmounts(
    Math.max(0, input.balanceCents),
    count,
  );
  const base = startOfLocalDay(input.baseDueDate);

  return amounts.map((valueCents, index) => ({
    index: index + 1,
    dueDate: addMonthsToLocalDate(base, index),
    valueCents,
  }));
}

/**
 * Ao alterar o valor da parcela `changedIndex` (0-based), redistribui a
 * diferença nas demais para manter a soma = `totalCents`.
 * Se só há 1 parcela, força o valor ao total.
 */
export function redistributeBudgetApproveInstallmentValues(input: {
  valuesCents: number[];
  changedIndex: number;
  nextValueCents: number;
  totalCents: number;
}): number[] {
  const { valuesCents, changedIndex, totalCents } = input;
  if (valuesCents.length === 0) {
    return [];
  }

  const safeTotal = Math.max(0, totalCents);
  const nextValue = Math.max(0, Math.floor(input.nextValueCents));

  if (valuesCents.length === 1) {
    return [safeTotal];
  }

  if (changedIndex < 0 || changedIndex >= valuesCents.length) {
    return [...valuesCents];
  }

  const clamped = Math.min(nextValue, safeTotal);
  const othersCount = valuesCents.length - 1;
  const remaining = safeTotal - clamped;
  const otherWeights = valuesCents
    .map((value, index) => (index === changedIndex ? 0 : Math.max(0, value)))
    .filter((_, index) => index !== changedIndex);
  const weightSum = otherWeights.reduce((sum, value) => sum + value, 0);

  const next = valuesCents.map((value, index) =>
    index === changedIndex ? clamped : value,
  );

  if (weightSum <= 0) {
    const base = Math.floor(remaining / othersCount);
    let allocated = 0;
    let filled = 0;
    for (let index = 0; index < next.length; index += 1) {
      if (index === changedIndex) continue;
      filled += 1;
      if (filled === othersCount) {
        next[index] = remaining - allocated;
      } else {
        next[index] = base;
        allocated += base;
      }
    }
    return next;
  }

  let allocated = 0;
  let lastOtherIndex = -1;
  for (let index = 0; index < next.length; index += 1) {
    if (index === changedIndex) continue;
    lastOtherIndex = index;
    const share = Math.floor((remaining * Math.max(0, valuesCents[index] ?? 0)) / weightSum);
    next[index] = share;
    allocated += share;
  }
  if (lastOtherIndex >= 0) {
    next[lastOtherIndex] = (next[lastOtherIndex] ?? 0) + (remaining - allocated);
  }

  return next;
}
