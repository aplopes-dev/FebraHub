import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { stockService } from "../services/stock.service";
import { SUPPLIERS_KEY } from "./use-suppliers";
import { STOCK_PRODUCTS_KEY } from "./use-stock-products";
import { useClinicId } from "../lib/use-clinic-id";

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  const { clinicId } = useClinicId();

  return useMutation({
    mutationFn: (id: string) => stockService.suppliers.delete(clinicId, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...SUPPLIERS_KEY, clinicId] });
      void queryClient.invalidateQueries({ queryKey: STOCK_PRODUCTS_KEY });
    },
    onError: () => {
      toast.error("Erro ao excluir fornecedor.");
    },
  });
}
