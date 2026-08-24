import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useClinicId } from "../lib/use-clinic-id";
import { stockService, type StockWithdrawalPayload } from "../services/stock.service";
import type { StockProduct, StockStatus } from "../types";
import { STOCK_PRODUCTS_KEY } from "./use-stock-products";
import { STOCK_STATS_KEY } from "./use-stock-stats";
import { STOCK_MOVEMENTS_KEY } from "./use-stock-movements";

interface ProductsQueryData {
  products: StockProduct[];
}

function calcStatus(quantity: number, minQuantity: number): StockStatus {
  if (quantity <= 0) return "out_of_stock";
  if (quantity <= minQuantity) return "low_stock";
  return "in_stock";
}

export function useStockWithdrawal() {
  const queryClient = useQueryClient();
  const { clinicId } = useClinicId();
  const fullProductsKey = [...STOCK_PRODUCTS_KEY, clinicId];

  return useMutation({
    mutationFn: (data: StockWithdrawalPayload) =>
      stockService.withdrawals.create(clinicId, data),

    onMutate: async ({ productId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: fullProductsKey });

      const snapshot = queryClient.getQueryData<ProductsQueryData>(fullProductsKey);

      queryClient.setQueryData<ProductsQueryData>(fullProductsKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          products: old.products.map((p) => {
            if (p.id !== productId) return p;
            const newQty = Math.max(0, p.quantity - quantity);
            return {
              ...p,
              quantity: newQty,
              status: calcStatus(newQty, p.minQuantity),
              activeValue: newQty * p.unitCost,
            };
          }),
        };
      });

      return { snapshot };
    },

    onError: (error: unknown, _vars, context) => {
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(fullProductsKey, context.snapshot);
      }
      const msg = error instanceof Error ? error.message : undefined;
      toast.error(msg ?? "Erro ao registrar retirada");
    },

    onSuccess: () => {
      toast.success("Retirada registrada com sucesso");
      void queryClient.invalidateQueries({ queryKey: [...STOCK_PRODUCTS_KEY, clinicId] });
      void queryClient.invalidateQueries({ queryKey: [...STOCK_STATS_KEY, clinicId] });
      void queryClient.invalidateQueries({ queryKey: [...STOCK_MOVEMENTS_KEY, clinicId] });
    },
  });
}
