export type FinancialEntryTypeName = "income" | "expense";

export type FinancialTypeAccess = {
  canViewIncome: boolean;
  canViewExpense: boolean;
};

/**
 * Tipos legíveis nas listagens — só pelos checkboxes de visualizar.
 * `financial_summary` é plus de KPI e NÃO amplia tipos nem abre o módulo.
 */
export function resolveAllowedEntryTypes(
  access: FinancialTypeAccess,
): FinancialEntryTypeName[] {
  const types: FinancialEntryTypeName[] = [];
  if (access.canViewIncome) types.push("income");
  if (access.canViewExpense) types.push("expense");
  return types;
}

/**
 * CSV `types` para a API: intersecta filtro da UI com o permitido.
 * Ambos permitidos e sem filtro explícito → `undefined` (sem restringir na query).
 */
export function resolveListTypesParam(
  filterTypes: FinancialEntryTypeName[],
  allowed: FinancialEntryTypeName[],
): string | undefined {
  if (allowed.length === 0) return undefined;

  const selected =
    filterTypes.length > 0
      ? filterTypes.filter((type) => allowed.includes(type))
      : allowed;

  const effective = selected.length > 0 ? selected : allowed;

  if (effective.length === 2 && allowed.length === 2) {
    return undefined;
  }

  return effective.join(",");
}
