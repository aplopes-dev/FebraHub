export const electronicSignaturesReportKeys = {
  all: ['clinic', 'electronic-signatures-report'] as const,
  list: (
    storeId: string,
    params: {
      startDate: string;
      endDate: string;
      kind?: string;
      statuses?: string[];
      page: number;
      perPage: number;
    },
  ) =>
    [
      ...electronicSignaturesReportKeys.all,
      'list',
      storeId,
      params,
    ] as const,
};
