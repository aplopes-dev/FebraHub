"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@citybox/mui";
import { useCatalogScope } from "@/lib/organization-context";
import { ComercioApiError } from "@/lib/api/comercio-client";
import {
  createStockApi,
  deleteStockApi,
  updateStockApi,
} from "@/features/stock/api/stocks.service";
import type { SaveStockPayload } from "@/features/stock/api/stock.dto";
import { stockKeys } from "@/features/stock/hooks/query-keys";

function errorMessage(error: unknown): string {
  if (error instanceof ComercioApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Erro inesperado";
}

export function useCreateStockMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SaveStockPayload) => createStockApi(payload),
    onSuccess: (stock) => {
      void queryClient.invalidateQueries({ queryKey: stockKeys.all(scope) });
      toast.success("Estoque criado", { description: stock.name });
    },
    onError: (error) => {
      toast.error("Não foi possível criar o estoque", {
        description: errorMessage(error),
      });
    },
  });
}

export function useUpdateStockMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: SaveStockPayload;
    }) => updateStockApi(id, payload),
    onSuccess: (stock) => {
      void queryClient.invalidateQueries({ queryKey: stockKeys.all(scope) });
      toast.success("Estoque atualizado", { description: stock.name });
    },
    onError: (error) => {
      toast.error("Não foi possível salvar o estoque", {
        description: errorMessage(error),
      });
    },
  });
}

export function useDeleteStockMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteStockApi(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: stockKeys.all(scope) });
      toast.success("Estoque excluído");
    },
    onError: (error) => {
      toast.error("Não foi possível excluir o estoque", {
        description: errorMessage(error),
      });
    },
  });
}
