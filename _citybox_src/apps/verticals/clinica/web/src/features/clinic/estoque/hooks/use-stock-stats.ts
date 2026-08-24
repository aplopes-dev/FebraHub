import { useQuery } from "@tanstack/react-query";
import { useClinicId } from "../lib/use-clinic-id";
import { stockService } from "../services/stock.service";

export const STOCK_STATS_KEY = ["stock-stats"] as const;

export function useStockStats() {
  const { clinicId, isReady } = useClinicId();
  return useQuery({
    queryKey: [...STOCK_STATS_KEY, clinicId],
    queryFn: () => stockService.stats(clinicId),
    enabled: isReady,
  });
}
