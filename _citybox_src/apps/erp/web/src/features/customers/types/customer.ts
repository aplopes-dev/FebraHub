export type CustomerStage = "lead" | "opportunity" | "active" | "inactive";

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  salesTotal: number;
  createdAt: string;
  stage: CustomerStage;
  categoryId?: string | null;
};

export type CustomerListTab = "all" | CustomerStage;

export type CustomerTabCounts = Record<CustomerListTab, number>;

export type CustomerListMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type CustomerListParams = {
  tab: CustomerListTab;
  search: string;
  page: number;
  perPage: number;
};

export type CustomerListResult = {
  data: Customer[];
  meta: CustomerListMeta;
  tabCounts: CustomerTabCounts;
};
