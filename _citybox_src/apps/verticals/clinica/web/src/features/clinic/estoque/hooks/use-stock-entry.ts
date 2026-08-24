import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { stockService, type StockEntryPayload } from "../services/stock.service";
import { STOCK_PRODUCTS_KEY } from "./use-stock-products";
import { STOCK_STATS_KEY } from "./use-stock-stats";
import { STOCK_MOVEMENTS_KEY } from "./use-stock-movements";
import { useClinicId } from "../lib/use-clinic-id";

export function useStockEntry() {
  const queryClient = useQueryClient();
  const { clinicId } = useClinicId();

  return useMutation({
    mutationFn: (data: StockEntryPayload) => stockService.entries.create(clinicId, data),
    onSuccess: () => {
      toast.success("Entrada registrada com sucesso");
      void queryClient.invalidateQueries({ queryKey: [...STOCK_PRODUCTS_KEY, clinicId] });
      void queryClient.invalidateQueries({ queryKey: [...STOCK_STATS_KEY, clinicId] });
      void queryClient.invalidateQueries({ queryKey: [...STOCK_MOVEMENTS_KEY, clinicId] });
    },
    onError: () => {
      toast.error("Erro ao registrar entrada");
    },
  });
}
