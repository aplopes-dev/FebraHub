import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ClinicaApiError } from "@/features/clinic/shared/api";
import { stockService, type CreateSupplierPayload } from "../services/stock.service";
import { SUPPLIERS_KEY } from "./use-suppliers";
import { STOCK_PRODUCTS_KEY } from "./use-stock-products";
import { useClinicId } from "../lib/use-clinic-id";

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  const { clinicId } = useClinicId();

  return useMutation({
    mutationFn: (data: CreateSupplierPayload) => stockService.suppliers.create(clinicId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...SUPPLIERS_KEY, clinicId] });
      void queryClient.invalidateQueries({ queryKey: STOCK_PRODUCTS_KEY });
    },
    onError: (error) => {
      const message =
        error instanceof ClinicaApiError
          ? error.message
          : "Erro ao criar fornecedor. Verifique se o nome já existe.";
      toast.error(message);
    },
  });
}
