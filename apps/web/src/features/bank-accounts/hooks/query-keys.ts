export const bankAccountKeys = {
  all: (scope: string) => ["api", "bank-accounts", scope] as const,
  options: (scope: string) => [...bankAccountKeys.all(scope), "options"] as const,
  detail: (scope: string, id: string) =>
    [...bankAccountKeys.all(scope), "detail", id] as const,
  transactions: (scope: string, id: string, params: unknown) =>
    [...bankAccountKeys.all(scope), "transactions", id, params] as const,
  statement: (scope: string, id: string, params: unknown) =>
    [...bankAccountKeys.all(scope), "statement", id, params] as const,
};
