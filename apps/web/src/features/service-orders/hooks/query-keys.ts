export const serviceOrderKeys = {
  all: (scope: string) => ["api", "service-orders", scope] as const,
  list: (scope: string, params: unknown) =>
    [...serviceOrderKeys.all(scope), "list", params] as const,
  detail: (scope: string, id: string) =>
    [...serviceOrderKeys.all(scope), "detail", id] as const,
  statuses: (scope: string) =>
    [...serviceOrderKeys.all(scope), "statuses"] as const,
};
