import { useQuery } from "@tanstack/react-query";
import { useClinicId } from "../lib/use-clinic-id";
import { stockService } from "../services/stock.service";

export const STOCK_PRODUCTS_KEY = ["stock-products"] as const;

const DEFAULT_STOCK_PRODUCTS_PAGE = 1;
const DEFAULT_STOCK_PRODUCTS_PER_PAGE = 1000;

type UseStockProductsParams = {
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export function useStockProducts(search?: string, params?: UseStockProductsParams) {
  const { clinicId, isReady } = useClinicId();
  const page = params?.page ?? DEFAULT_STOCK_PRODUCTS_PAGE;
  const perPage = params?.perPage ?? DEFAULT_STOCK_PRODUCTS_PER_PAGE;
  const sortBy = params?.sortBy;
  const sortOrder = params?.sortOrder;

  return useQuery({
    queryKey: [...STOCK_PRODUCTS_KEY, clinicId, search ?? "", page, perPage, sortBy, sortOrder],
    queryFn: () =>
      stockService.products.list(clinicId, {
        search: search || undefined,
        page,
        perPage,
        sortBy,
        sortOrder,
      }),
    enabled: isReady,
  });
}
