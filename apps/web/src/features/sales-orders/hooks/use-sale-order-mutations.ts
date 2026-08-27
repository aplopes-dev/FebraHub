"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/ui";
import type { SaveSaleOrderPayload } from "@/features/sales-orders/api/sale-order.dto";
import {
  createSaleOrderApi,
  deleteSaleOrderApi,
  patchSaleOrderStatusApi,
  restoreSaleOrderApi,
  updateSaleOrderApi,
} from "@/features/sales-orders/api/sale-orders.service";
import { saleOrderKeys } from "@/features/sales-orders/hooks/query-keys";
import type { SaleOrderStatus } from "@/features/sales-orders/types/sale-order";
import { useCatalogScope } from "@/lib/organization-context";

function invalidateSaleOrders(queryClient: ReturnType<typeof useQueryClient>, scope: string) {
  return queryClient.invalidateQueries({ queryKey: saleOrderKeys.all(scope) });
}

export function useCreateSaleOrderMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SaveSaleOrderPayload) => createSaleOrderApi(payload),
    onSuccess: async () => {
      await invalidateSaleOrders(queryClient, scope);
      toast.success("Pedido salvo.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Não foi possível salvar o pedido.");
    },
  });
}

export function useUpdateSaleOrderMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: SaveSaleOrderPayload;
    }) => updateSaleOrderApi(id, payload),
    onSuccess: async () => {
      await invalidateSaleOrders(queryClient, scope);
      toast.success("Pedido atualizado.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Não foi possível atualizar o pedido.");
    },
  });
}

export function usePatchSaleOrderStatusMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: SaleOrderStatus }) =>
      patchSaleOrderStatusApi(id, status),
    onSuccess: async () => {
      await invalidateSaleOrders(queryClient, scope);
      toast.success("Status atualizado.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Não foi possível alterar o status.");
    },
  });
}

export function useDeleteSaleOrderMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSaleOrderApi(id),
    onSuccess: async () => {
      await invalidateSaleOrders(queryClient, scope);
      toast.success("Pedido excluído.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Não foi possível excluir o pedido.");
    },
  });
}

export function useRestoreSaleOrderMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => restoreSaleOrderApi(id),
    onSuccess: async () => {
      await invalidateSaleOrders(queryClient, scope);
      toast.success("Pedido restaurado.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Não foi possível restaurar o pedido.");
    },
  });
}
