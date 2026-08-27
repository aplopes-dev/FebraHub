export const financialEntryKeys = {
  all: (scope: string) => ["api", "financial-entries", scope] as const,
  lists: (scope: string) => [...financialEntryKeys.all(scope), "list"] as const,
  list: (scope: string, params: unknown) =>
    [...financialEntryKeys.lists(scope), params] as const,
  detail: (scope: string, id: string) =>
    [...financialEntryKeys.all(scope), "detail", id] as const,
};
