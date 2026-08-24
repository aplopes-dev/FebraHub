export const salesQueryKeys = {
  all: ["crm"] as const,
  funnels: (storeId: string) =>
    [...salesQueryKeys.all, "funnels", storeId] as const,
  funnel: (storeId: string, id: string) =>
    [...salesQueryKeys.funnels(storeId), id] as const,
  opportunities: (storeId: string) =>
    [...salesQueryKeys.all, "opportunities", storeId] as const,
  opportunitiesList: (storeId: string, filters?: unknown) =>
    [...salesQueryKeys.opportunities(storeId), "list", filters] as const,
  opportunity: (storeId: string, id: string) =>
    [...salesQueryKeys.opportunities(storeId), id] as const,
  opportunityHistory: (storeId: string, id: string) =>
    [...salesQueryKeys.opportunity(storeId, id), "history"] as const,
  labels: (storeId: string) =>
    [...salesQueryKeys.all, "labels", storeId] as const,
};
