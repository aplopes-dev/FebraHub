export const transactionKeys = {
  all: ['transactions'] as const,
  lists: () => [...transactionKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) =>
    [...transactionKeys.lists(), params] as const,
  details: () => [...transactionKeys.all, 'detail'] as const,
  detail: (id: string) => [...transactionKeys.details(), id] as const,
  documents: (id: string) => [...transactionKeys.detail(id), 'documents'] as const,
  reports: () => [...transactionKeys.all, 'report'] as const,
  report: (period?: { from?: string; to?: string }) =>
    [...transactionKeys.reports(), period ?? {}] as const,
};
