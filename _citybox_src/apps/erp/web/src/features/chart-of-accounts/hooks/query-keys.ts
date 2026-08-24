import type { ChartOfAccountListParams } from "@/features/chart-of-accounts/types/chart-of-account";

export const chartOfAccountKeys = {
  all: (scope: string) => ["comercio", "chart-of-accounts", scope] as const,
  lists: (scope: string) =>
    [...chartOfAccountKeys.all(scope), "list"] as const,
  list: (scope: string, params: ChartOfAccountListParams) =>
    [...chartOfAccountKeys.lists(scope), params] as const,
  detail: (scope: string, id: string) =>
    [...chartOfAccountKeys.all(scope), "detail", id] as const,
  options: (scope: string) =>
    [...chartOfAccountKeys.all(scope), "options"] as const,
};
