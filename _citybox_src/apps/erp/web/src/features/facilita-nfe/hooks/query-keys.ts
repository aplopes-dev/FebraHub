export const facilitaNfeKeys = {
  all: (scope: string) => ["fiscal", "facilita-nfe", scope] as const,
  company: (organizationId: string) =>
    ["fiscal", "facilita-nfe-company", organizationId] as const,
  lists: (scope: string) => [...facilitaNfeKeys.all(scope), "list"] as const,
  list: (scope: string, params: unknown) =>
    [...facilitaNfeKeys.lists(scope), params] as const,
  summaries: (scope: string) =>
    [...facilitaNfeKeys.all(scope), "summary"] as const,
  summary: (scope: string, params: unknown) =>
    [...facilitaNfeKeys.summaries(scope), params] as const,
};
