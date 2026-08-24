export const dashboardKeys = {
  all: ["dashboard"] as const,
  summary: (params: Record<string, any>) => [...dashboardKeys.all, "summary", params] as const,
};
