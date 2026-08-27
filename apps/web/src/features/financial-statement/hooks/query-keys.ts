export const financialStatementKeys = {
  all: (scope: string) => ["api", "financial-statement", scope] as const,
  lists: (scope: string) => [...financialStatementKeys.all(scope), "list"] as const,
  list: (scope: string, params: unknown) =>
    [...financialStatementKeys.lists(scope), params] as const,
  summaries: (scope: string) =>
    [...financialStatementKeys.all(scope), "summary"] as const,
  summary: (scope: string, params: unknown) =>
    [...financialStatementKeys.summaries(scope), params] as const,
  bankAccountBalances: (scope: string) =>
    [...financialStatementKeys.all(scope), "bank-account-balances"] as const,
};
