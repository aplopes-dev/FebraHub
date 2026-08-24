export const dashboardKeys = {
  all: ['dashboard'] as const,
  overview: (userId: string, orgType: string, period: string, storeId = '') =>
    [...dashboardKeys.all, 'overview', storeId, userId, orgType, period] as const,
};
