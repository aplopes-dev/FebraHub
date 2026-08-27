"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/ui";
import { useCatalogScope } from "@/lib/organization-context";
import { ApiError } from "@/lib/api/client";
import {
  cancelStockTransferApi,
  createStockTransferApi,
} from "@/features/stock-transfers/api/stock-transfers.service";
import { stockTransferKeys } from "@/features/stock-transfers/hooks/query-keys";
import {
  stockBalanceKeys,
  stockMovementKeys,
} from "@/features/stock-movements/hooks/query-keys";
import { productKeys } from "@/features/products/hooks/query-keys";
import type { StockTransferFormValues } from "@/features/stock-transfers/types/stock-transfer";

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Erro inesperado";
}

export function useCreateStockTransferMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: StockTransferFormValues) =>
      createStockTransferApi(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: stockTransferKeys.all(scope),
      });
      void queryClient.invalidateQueries({
        queryKey: stockBalanceKeys.all(scope),
      });
      void queryClient.invalidateQueries({
        queryKey: stockMovementKeys.all(scope),
      });
      void queryClient.invalidateQueries({
        queryKey: productKeys.all(scope),
      });
      toast.success("Transferência registrada.");
    },
    onError: (error) => {
      toast.error("Não foi possível registrar a transferência", {
        description: errorMessage(error),
      });
    },
  });
}

export function useCancelStockTransferMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cancelStockTransferApi(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: stockTransferKeys.all(scope),
      });
      void queryClient.invalidateQueries({
        queryKey: stockBalanceKeys.all(scope),
      });
      void queryClient.invalidateQueries({
        queryKey: stockMovementKeys.all(scope),
      });
      void queryClient.invalidateQueries({
        queryKey: productKeys.all(scope),
      });
      toast.success("Transferência cancelada.");
    },
    onError: (error) => {
      toast.error("Não foi possível cancelar a transferência", {
        description: errorMessage(error),
      });
    },
  });
}
