export const teamKeys = {
  all: (storeId: string) => ['team', storeId] as const,
  members: (storeId: string) => [...teamKeys.all(storeId), 'members'] as const,
  roles: (storeId: string) => [...teamKeys.all(storeId), 'roles'] as const,
};
