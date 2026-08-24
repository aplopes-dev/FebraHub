import type { PatientBudgetTreatmentItem } from '../types/patient-budget-form';

/**
 * Expande itens-base em N linhas de sessão (fisio).
 * N=1 → uma linha sem sessionIndex/Total.
 * N≥2 → N linhas com 1/N … N/N.
 */
export function expandBudgetTreatmentsBySessions(
  baseItems: PatientBudgetTreatmentItem[],
  sessionsCount: number,
): PatientBudgetTreatmentItem[] {
  const total = Number.isFinite(sessionsCount) ? Math.trunc(sessionsCount) : 1;
  if (total <= 1) {
    return baseItems.map((item) => ({
      ...item,
      sessionIndex: null,
      sessionTotal: null,
    }));
  }

  return baseItems.flatMap((item) =>
    Array.from({ length: total }, (_, offset) => ({
      ...item,
      id: crypto.randomUUID(),
      sessionIndex: offset + 1,
      sessionTotal: total,
    })),
  );
}

export function formatBudgetTreatmentListName(
  item: Pick<
    PatientBudgetTreatmentItem,
    'treatmentName' | 'sessionIndex' | 'sessionTotal'
  >,
): string {
  const name = item.treatmentName.trim() || '—';
  if (
    typeof item.sessionTotal === 'number' &&
    item.sessionTotal >= 2 &&
    typeof item.sessionIndex === 'number' &&
    item.sessionIndex >= 1
  ) {
    return `${name} - ${item.sessionIndex}/${item.sessionTotal}`;
  }
  return name;
}
