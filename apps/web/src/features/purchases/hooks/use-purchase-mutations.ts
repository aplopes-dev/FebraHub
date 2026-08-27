"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/ui";
import { useCatalogScope } from "@/lib/organization-context";
import { ApiError } from "@/lib/api/client";
import {
  createPurchaseApi,
  deletePurchaseApi,
  restorePurchaseApi,
  updatePurchaseApi,
} from "@/features/purchases/api/purchases.service";
import { purchaseKeys } from "@/features/purchases/hooks/query-keys";
import {
  stockBalanceKeys,
  stockMovementKeys,
} from "@/features/stock-movements/hooks/query-keys";
import { productKeys } from "@/features/products/hooks/query-keys";
import type { SavePurchasePayload } from "@/features/purchases/api/purchase.dto";

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Erro inesperado";
}

/** Compra recebida gera entrada de estoque no backend — invalida os caches derivados. */
function invalidatePurchaseRelated(
  queryClient: ReturnType<typeof useQueryClient>,
  scope: string,
) {
  void queryClient.invalidateQueries({ queryKey: purchaseKeys.all(scope) });
  void queryClient.invalidateQueries({ queryKey: stockBalanceKeys.all(scope) });
  void queryClient.invalidateQueries({ queryKey: stockMovementKeys.all(scope) });
  void queryClient.invalidateQueries({ queryKey: productKeys.all(scope) });
}

export function useCreatePurchaseMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SavePurchasePayload) => createPurchaseApi(payload),
    onSuccess: () => {
      invalidatePurchaseRelated(queryClient, scope);
      toast.success("Compra registrada.");
    },
    onError: (error) => {
      toast.error("Não foi possível registrar a compra", {
        description: errorMessage(error),
      });
    },
  });
}

export function useUpdatePurchaseMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: SavePurchasePayload;
    }) => updatePurchaseApi(id, payload),
    onSuccess: () => {
      invalidatePurchaseRelated(queryClient, scope);
      toast.success("Compra atualizada.");
    },
    onError: (error) => {
      toast.error("Não foi possível atualizar a compra", {
        description: errorMessage(error),
      });
    },
  });
}

export function useDeletePurchaseMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deletePurchaseApi(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: purchaseKeys.all(scope) });
      toast.success("Compra excluída.");
    },
    onError: (error) => {
      toast.error("Não foi possível excluir a compra", {
        description: errorMessage(error),
      });
    },
  });
}

export function useRestorePurchaseMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => restorePurchaseApi(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: purchaseKeys.all(scope) });
      toast.success("Compra restaurada.");
    },
    onError: (error) => {
      toast.error("Não foi possível restaurar a compra", {
        description: errorMessage(error),
      });
    },
  });
}
