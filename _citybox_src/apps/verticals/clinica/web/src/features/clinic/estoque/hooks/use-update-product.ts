import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { stockService, type UpdateProductPayload } from "../services/stock.service";
import { useClinicId } from "../lib/use-clinic-id";
import { STOCK_PRODUCTS_KEY } from "./use-stock-products";
import { STOCK_STATS_KEY } from "./use-stock-stats";

interface UpdateProductInput {
  id: string;
  data: UpdateProductPayload;
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const { clinicId } = useClinicId();

  return useMutation({
    mutationFn: ({ id, data }: UpdateProductInput) =>
      stockService.products.update(clinicId, id, data),
    onSuccess: () => {
      toast.success("Produto atualizado com sucesso");
      void queryClient.invalidateQueries({ queryKey: [...STOCK_PRODUCTS_KEY, clinicId] });
      void queryClient.invalidateQueries({ queryKey: [...STOCK_STATS_KEY, clinicId] });
    },
    onError: () => {
      toast.error("Erro ao atualizar produto");
    },
  });
}
