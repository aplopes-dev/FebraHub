export const campaignsQueryKeys = {
  all: (storeId: string) => ["marketing", "campaigns", storeId] as const,
  list: (
    storeId: string,
    params: { status?: string; segment?: string; search?: string } = {},
  ) =>
    [
      ...campaignsQueryKeys.all(storeId),
      "list",
      params.status ?? "all",
      params.segment ?? null,
      params.search ?? null,
    ] as const,
  detail: (storeId: string, id: string) =>
    [...campaignsQueryKeys.all(storeId), "get", id] as const,
  submissions: (
    storeId: string,
    campaignId: string,
    params: { page?: number; perPage?: number } = {},
  ) =>
    [
      ...campaignsQueryKeys.all(storeId),
      "submissions",
      campaignId,
      params.page ?? 1,
      params.perPage ?? 50,
    ] as const,
  messages: (
    storeId: string,
    campaignId: string,
    params: { withRepliesOnly?: boolean; search?: string } = {},
  ) =>
    [
      ...campaignsQueryKeys.all(storeId),
      "messages",
      campaignId,
      params.withRepliesOnly === true ? "with-replies" : "all",
      params.search?.trim() || null,
    ] as const,
};

/** Opções compartilhadas — dados sempre frescos ao entrar na tela (evita precisar F5). */
export const campaignsQueryOptions = {
  staleTime: 0,
  refetchOnMount: "always" as const,
  refetchOnWindowFocus: true,
};
