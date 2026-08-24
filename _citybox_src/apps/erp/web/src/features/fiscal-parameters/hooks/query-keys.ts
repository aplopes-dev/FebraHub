import type { FiscalParameterListParams } from "@/features/fiscal-parameters/types/fiscal-parameters";

export const fiscalParameterKeys = {
  all: (scope: string) => ["comercio", "fiscal-parameters", scope] as const,
  lists: (scope: string) =>
    [...fiscalParameterKeys.all(scope), "list"] as const,
  list: (scope: string, params: FiscalParameterListParams) =>
    [...fiscalParameterKeys.lists(scope), params] as const,
  detail: (scope: string, productId: string) =>
    [...fiscalParameterKeys.all(scope), "detail", productId] as const,
};
