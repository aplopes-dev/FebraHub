export const contractModelKeys = {
  all: (storeId: string) => ['clinic', 'contract-models', storeId] as const,
  list: (storeId: string) => [...contractModelKeys.all(storeId), 'list'] as const,
};
