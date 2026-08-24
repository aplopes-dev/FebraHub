export const financialResultKeys = {
  all: (scope: string) => ["comercio", "financial-results", scope] as const,
  report: (scope: string, from: string, to: string) =>
    [...financialResultKeys.all(scope), "report", from, to] as const,
};
