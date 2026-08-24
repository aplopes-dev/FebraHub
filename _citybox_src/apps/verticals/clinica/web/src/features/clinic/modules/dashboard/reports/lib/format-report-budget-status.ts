const BUDGET_STATUS_LABEL: Record<string, string> = {
  approved: 'Aprovado',
  pending: 'Em aberto',
  rejected: 'Reprovado',
  expired: 'Expirado',
};

export function formatReportBudgetStatusLabel(status: string): string {
  return BUDGET_STATUS_LABEL[status] ?? status;
}
