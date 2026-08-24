export const financeKeys = {
  all: ['finance'] as const,
  summary: (userId: string, orgType: string, period?: Record<string, unknown>) =>
    [...financeKeys.all, 'summary', userId, orgType, period ?? {}] as const,
  commissions: (agentId: string) =>
    [...financeKeys.all, 'commissions', agentId] as const,
  payouts: () => [...financeKeys.all, 'payouts'] as const,
};
