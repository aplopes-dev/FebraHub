export type ReportExpensesByCategoryRow = {
  id: string;
  categoryName: string;
  valueCents: number;
  percentage: number;
};

export type ListReportExpensesByCategoryCriteria = {
  startDate: string;
  endDate: string;
  skip: number;
  take: number;
};

export type ListReportExpensesByCategoryResult = {
  items: ReportExpensesByCategoryRow[];
  total: number;
};
