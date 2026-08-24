/** Compara vencimento (yyyy-MM-dd) com hoje civil em America/Sao_Paulo. */
export type DueDateRelation = "future" | "today" | "past";

export function todayIsoAmericaSaoPaulo(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function dueDateRelation(
  dueDateIso: string,
  todayIso = todayIsoAmericaSaoPaulo(),
): DueDateRelation {
  const dueDay = dueDateIso.slice(0, 10);
  if (dueDay > todayIso) return "future";
  if (dueDay < todayIso) return "past";
  return "today";
}

export type ReceiveIncomePermissionFlags = {
  canSettleIncome: boolean;
  canSettleFuture: boolean;
  canSettleRetroactive: boolean;
};

/**
 * Quem pode clicar Receber numa receita pendente (pelo vencimento):
 * - futuro → exige `settleFuture` (parcelas a vencer / mês seguinte)
 * - passado → exige `settleRetroactive` (atraso)
 * - hoje → exige `settle` (pagar/receber)
 *
 * `settle` NÃO libera futuro nem atraso sozinho.
 */
export function canReceiveIncomeEntry(
  flags: ReceiveIncomePermissionFlags,
  dueDateIso: string,
  todayIso = todayIsoAmericaSaoPaulo(),
): boolean {
  const relation = dueDateRelation(dueDateIso, todayIso);
  if (relation === "future") return flags.canSettleFuture;
  if (relation === "past") return flags.canSettleRetroactive;
  return flags.canSettleIncome;
}
