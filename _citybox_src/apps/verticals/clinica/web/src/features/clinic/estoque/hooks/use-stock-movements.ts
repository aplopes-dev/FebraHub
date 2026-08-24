import { useQuery } from "@tanstack/react-query";
import { useClinicId } from "../lib/use-clinic-id";
import { stockService, type MovementsFilters } from "../services/stock.service";

export const STOCK_MOVEMENTS_KEY = ["stock-movements"] as const;

export function useStockMovements(filters?: MovementsFilters) {
  const { clinicId, isReady } = useClinicId();
  return useQuery({
    queryKey: [...STOCK_MOVEMENTS_KEY, clinicId, filters],
    queryFn: () => stockService.movements.list(clinicId, filters),
    enabled: isReady,
  });
}
