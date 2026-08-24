/**
 * Persiste sessão só quando o pacote tem 2+ sessões (sem 1/1 no nome).
 */
export function normalizeBudgetItemSessions(input: {
  sessionIndex?: number | null;
  sessionTotal?: number | null;
}): { sessionIndex: number | null; sessionTotal: number | null } {
  const total =
    typeof input.sessionTotal === 'number' && Number.isFinite(input.sessionTotal)
      ? Math.trunc(input.sessionTotal)
      : null;
  const index =
    typeof input.sessionIndex === 'number' && Number.isFinite(input.sessionIndex)
      ? Math.trunc(input.sessionIndex)
      : null;

  if (total == null || total < 2 || index == null || index < 1 || index > total) {
    return { sessionIndex: null, sessionTotal: null };
  }

  return { sessionIndex: index, sessionTotal: total };
}
