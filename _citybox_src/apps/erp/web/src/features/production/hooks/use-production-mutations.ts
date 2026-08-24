"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@citybox/mui";
import { useCatalogScope } from "@/lib/organization-context";
import { ComercioApiError } from "@/lib/api/comercio-client";
import {
  addProductionHistoryCommentApi,
  cancelProductionOrderApi,
  createProductionOrderApi,
  finalizeProductionOrderApi,
  startProductionOrderApi,
} from "@/features/production/api/production.service";
import { productionKeys } from "@/features/production/hooks/query-keys";
import {
  stockBalanceKeys,
  stockMovementKeys,
} from "@/features/stock-movements/hooks/query-keys";
import { productKeys } from "@/features/products/hooks/query-keys";
import type { ProductionOrderFormValues } from "@/features/production/types/production";

function errorMessage(error: unknown): string {
  if (error instanceof ComercioApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Erro inesperado";
}

export function useCreateProductionOrderMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: ProductionOrderFormValues) =>
      createProductionOrderApi(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: productionKeys.all(scope),
      });
      toast.success("Pedido de produção gerado.");
    },
    onError: (error) => {
      toast.error("Não foi possível gerar o pedido de produção", {
        description: errorMessage(error),
      });
    },
  });
}

export function useStartProductionOrderMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => startProductionOrderApi(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: productionKeys.all(scope),
      });
      toast.success("Produção iniciada.");
    },
    onError: (error) => {
      toast.error("Não foi possível iniciar a produção", {
        description: errorMessage(error),
      });
    },
  });
}

export function useCancelProductionOrderMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cancelProductionOrderApi(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: productionKeys.all(scope),
      });
      toast.success("Produção cancelada.");
    },
    onError: (error) => {
      toast.error("Não foi possível cancelar a produção", {
        description: errorMessage(error),
      });
    },
  });
}

type FinalizeProductionOrderInput = {
  id: string;
  producedQuantity: number;
  observation?: string;
};

export function useFinalizeProductionOrderMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, producedQuantity, observation }: FinalizeProductionOrderInput) =>
      finalizeProductionOrderApi(id, {
        producedQuantity: String(producedQuantity),
        observation,
      }),
    onSuccess: () => {
      // Finalizar movimenta o estoque (saída de insumos + entrada do produto).
      void queryClient.invalidateQueries({
        queryKey: productionKeys.all(scope),
      });
      void queryClient.invalidateQueries({
        queryKey: stockMovementKeys.all(scope),
      });
      void queryClient.invalidateQueries({
        queryKey: stockBalanceKeys.all(scope),
      });
      void queryClient.invalidateQueries({ queryKey: productKeys.all(scope) });
      toast.success("Produção finalizada. Estoque movimentado.");
    },
    onError: (error) => {
      toast.error("Não foi possível finalizar a produção", {
        description: errorMessage(error),
      });
    },
  });
}

type AddProductionCommentInput = {
  orderId: string;
  description: string;
};

export function useAddProductionCommentMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, description }: AddProductionCommentInput) =>
      addProductionHistoryCommentApi(orderId, { description }),
    onSuccess: (_entry, variables) => {
      void queryClient.invalidateQueries({
        queryKey: productionKeys.history(scope, variables.orderId),
      });
    },
    onError: (error) => {
      toast.error("Não foi possível adicionar o comentário", {
        description: errorMessage(error),
      });
    },
  });
}
