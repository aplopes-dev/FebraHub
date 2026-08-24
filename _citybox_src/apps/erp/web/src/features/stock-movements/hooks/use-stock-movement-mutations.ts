"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@citybox/mui";
import { useCatalogScope } from "@/lib/organization-context";
import { ComercioApiError } from "@/lib/api/comercio-client";
import { createStockMovementApi } from "@/features/stock-movements/api/stock-movements.service";
import {
  stockBalanceKeys,
  stockMovementKeys,
} from "@/features/stock-movements/hooks/query-keys";
import type { StockMovementFormValues } from "@/features/stock-movements/types/stock-movement";

function errorMessage(error: unknown): string {
  if (error instanceof ComercioApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Erro inesperado";
}

export function useCreateStockMovementMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: StockMovementFormValues) =>
      createStockMovementApi(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: stockMovementKeys.all(scope),
      });
      void queryClient.invalidateQueries({
        queryKey: stockBalanceKeys.all(scope),
      });
      toast.success("Movimentação registrada.");
    },
    onError: (error) => {
      toast.error("Não foi possível registrar a movimentação", {
        description: errorMessage(error),
      });
    },
  });
}
