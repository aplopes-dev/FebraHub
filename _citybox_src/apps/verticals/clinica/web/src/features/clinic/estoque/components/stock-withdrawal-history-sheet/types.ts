export interface StockWithdrawal {
  id: string;
  product: {
    id: string;
    name: string;
    photoUrl: string | null;
  };
  quantity: number;
  withdrawnBy: string;
  authorizedBy: string;
  date: Date;
}

export interface WithdrawalFilters {
  search: string;
  startDate?: Date;
  endDate?: Date;
}
