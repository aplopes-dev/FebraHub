"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@citybox/mui";
import { useCatalogScope } from "@/lib/organization-context";
import { ComercioApiError } from "@/lib/api/comercio-client";
import { createInventoryApi } from "@/features/stock-inventory/api/inventories.service";
import { inventoryKeys } from "@/features/stock-inventory/hooks/query-keys";
import {
  stockBalanceKeys,
  stockMovementKeys,
} from "@/features/stock-movements/hooks/query-keys";
import { productKeys } from "@/features/products/hooks/query-keys";
import type { InventoryLine } from "@/features/stock-inventory/types/inventory";

function errorMessage(error: unknown): string {
  if (error instanceof ComercioApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Erro inesperado";
}

type CreateInventoryInput = {
  stockId: string;
  name: string;
  lines: InventoryLine[];
};

export function useCreateInventoryMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ stockId, name, lines }: CreateInventoryInput) =>
      createInventoryApi(stockId, {
        name: name.trim(),
        lines: lines.map((line) => ({
          productId: line.productId,
          countedQuantity: String(line.countedQuantity),
        })),
      }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: inventoryKeys.all(scope),
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
      void queryClient.invalidateQueries({
        queryKey: stockBalanceKeys.lists(scope),
      });
      toast.success("Inventário finalizado. Saldo do estoque ajustado.");
      return variables;
    },
    onError: (error) => {
      toast.error("Não foi possível finalizar o inventário", {
        description: errorMessage(error),
      });
    },
  });
}
