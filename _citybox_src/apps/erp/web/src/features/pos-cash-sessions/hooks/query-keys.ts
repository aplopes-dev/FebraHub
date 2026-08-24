import type {
  PosCashSaleListParams,
  PosCashSessionListParams,
} from "@/features/pos-cash-sessions/types/pos-cash-session";

export const posCashSessionKeys = {
  all: (scope: string) => ["comercio", "pos-cash-sessions", scope] as const,
  lists: (scope: string) =>
    [...posCashSessionKeys.all(scope), "list"] as const,
  list: (scope: string, params: PosCashSessionListParams) =>
    [...posCashSessionKeys.lists(scope), params] as const,
  detail: (scope: string, sessionId: string) =>
    [...posCashSessionKeys.all(scope), "detail", sessionId] as const,
  sales: (scope: string, params: PosCashSaleListParams) =>
    [...posCashSessionKeys.all(scope), "sales", params] as const,
  sale: (scope: string, sessionId: string, saleId: string) =>
    [...posCashSessionKeys.all(scope), "sale", sessionId, saleId] as const,
  movements: (scope: string, sessionId: string) =>
    [...posCashSessionKeys.all(scope), "movements", sessionId] as const,
  closingReport: (scope: string, sessionId: string) =>
    [...posCashSessionKeys.all(scope), "closing-report", sessionId] as const,
};
