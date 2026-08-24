import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { stockService, type UpdateSupplierPayload } from "../services/stock.service";
import { SUPPLIERS_KEY } from "./use-suppliers";
import { STOCK_PRODUCTS_KEY } from "./use-stock-products";
import { useClinicId } from "../lib/use-clinic-id";

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  const { clinicId } = useClinicId();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSupplierPayload }) =>
      stockService.suppliers.update(clinicId, id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...SUPPLIERS_KEY, clinicId] });
      void queryClient.invalidateQueries({ queryKey: STOCK_PRODUCTS_KEY });
    },
    onError: () => {
      toast.error("Erro ao atualizar fornecedor.");
    },
  });
}
