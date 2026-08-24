import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { stockService, type CreateProductPayload } from "../services/stock.service";
import { STOCK_PRODUCTS_KEY } from "./use-stock-products";
import { STOCK_STATS_KEY } from "./use-stock-stats";
import { useClinicId } from "../lib/use-clinic-id";

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { clinicId } = useClinicId();

  return useMutation({
    mutationFn: (data: CreateProductPayload) => stockService.products.create(clinicId, data),
    onSuccess: () => {
      toast.success("Produto criado com sucesso");
      void queryClient.invalidateQueries({ queryKey: [...STOCK_PRODUCTS_KEY, clinicId] });
      void queryClient.invalidateQueries({ queryKey: [...STOCK_STATS_KEY, clinicId] });
    },
    onError: () => {
      toast.error("Erro ao criar produto");
    },
  });
}
