export const bankStatementKeys = {
  all: (scope: string) => ["api", "bank-statements", scope] as const,
  lists: (scope: string) => [...bankStatementKeys.all(scope), "list"] as const,
  list: (scope: string, params: unknown) =>
    [...bankStatementKeys.lists(scope), params] as const,
  detail: (scope: string, id: string) =>
    [...bankStatementKeys.all(scope), "detail", id] as const,
  transactions: (scope: string, bankStatementId: string, params: unknown) =>
    [...bankStatementKeys.detail(scope, bankStatementId), "transactions", params] as const,
  suggestions: (scope: string, bankStatementId: string, transactionId: string) =>
    [
      ...bankStatementKeys.detail(scope, bankStatementId),
      "suggestions",
      transactionId,
    ] as const,
};
