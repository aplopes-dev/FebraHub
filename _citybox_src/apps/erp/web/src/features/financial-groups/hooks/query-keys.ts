import type { FinancialGroupListParams } from "@/features/financial-groups/types/financial-group";

export const financialGroupKeys = {
  all: (scope: string) => ["comercio", "financial-groups", scope] as const,
  lists: (scope: string) =>
    [...financialGroupKeys.all(scope), "list"] as const,
  list: (scope: string, params: FinancialGroupListParams) =>
    [...financialGroupKeys.lists(scope), params] as const,
  detail: (scope: string, id: string) =>
    [...financialGroupKeys.all(scope), "detail", id] as const,
  options: (scope: string) =>
    [...financialGroupKeys.all(scope), "options"] as const,
};
