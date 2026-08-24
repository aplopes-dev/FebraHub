import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { stockService } from "../services/stock.service";
import { useClinicId } from "../lib/use-clinic-id";
import { STOCK_PRODUCTS_KEY } from "./use-stock-products";
import { STOCK_STATS_KEY } from "./use-stock-stats";

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const { clinicId } = useClinicId();

  return useMutation({
    mutationFn: (id: string) => stockService.products.delete(clinicId, id),
    onSuccess: () => {
      toast.success("Produto excluído com sucesso");
      void queryClient.invalidateQueries({ queryKey: [...STOCK_PRODUCTS_KEY, clinicId] });
      void queryClient.invalidateQueries({ queryKey: [...STOCK_STATS_KEY, clinicId] });
    },
    onError: () => {
      toast.error("Erro ao excluir produto");
    },
  });
}
