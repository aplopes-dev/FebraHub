export type CreateCommissionPaymentDto = {
  storeId: string;
  memberId: string;
  accrualIds: string[];
  description: string;
  paymentDate: string;
  accountId: string;
  paymentMethod: string;
  discountCents?: number;
  observation?: string | null;
};

export type ListCommissionHistoryDto = {
  storeId: string;
  page?: number;
  perPage?: number;
  startDate?: string;
  endDate?: string;
  memberId?: string;
  search?: string;
};

/** Detalhe do histórico agregado do profissional no período. */
export type GetCommissionPaymentDetailDto = {
  storeId: string;
  memberId: string;
  startDate?: string;
  endDate?: string;
};
