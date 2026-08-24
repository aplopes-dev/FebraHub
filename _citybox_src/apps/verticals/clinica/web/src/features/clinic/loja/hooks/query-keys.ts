export const signaturePackagesKeys = {
  all: ['clinic', 'signature-packages'] as const,
  credits: (storeId: string) =>
    [...signaturePackagesKeys.all, 'credits', storeId] as const,
  requests: (storeId: string) =>
    [...signaturePackagesKeys.all, 'requests', storeId] as const,
  requestsList: (
    storeId: string,
    params: {
      page: number;
      perPage: number;
      status?: string;
    },
  ) => [...signaturePackagesKeys.requests(storeId), 'list', params] as const,
};
