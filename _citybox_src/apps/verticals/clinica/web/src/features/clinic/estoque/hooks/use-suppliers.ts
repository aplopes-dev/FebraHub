import { useQuery } from "@tanstack/react-query";
import { stockService } from "../services/stock.service";
import { useClinicId } from "../lib/use-clinic-id";

export const SUPPLIERS_KEY = ["stock", "suppliers"] as const;

export function useSuppliers() {
  const { clinicId, isReady } = useClinicId();
  return useQuery({
    queryKey: [...SUPPLIERS_KEY, clinicId],
    queryFn: () => stockService.suppliers.list(clinicId),
    staleTime: 5 * 60 * 1000,
    select: (data) => data.suppliers,
    enabled: isReady,
  });
}
