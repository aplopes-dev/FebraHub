import type {
  SaleOrder,
  SaleOrderListFilters,
  SaleOrderSortOption,
} from "@/features/sales-orders/types/sale-order";

export type SaleListParams = {
  search: string;
  filters: SaleOrderListFilters;
  sort: SaleOrderSortOption;
  page: number;
  perPage: number;
};

export type SaleListMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type SaleListResult = {
  data: SaleOrder[];
  meta: SaleListMeta;
};
