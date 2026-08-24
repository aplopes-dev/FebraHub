"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@citybox/mui";
import {
  createServiceOrderApi,
  createServiceOrderStatusApi,
  deleteServiceOrderStatusApi,
  generateSaleFromServiceOrderApi,
  updateServiceOrderApi,
  updateServiceOrderStatusApi,
} from "@/features/service-orders/api/service-orders.service";
import { formValuesToWritable } from "@/features/service-orders/api/service-order.mapper";
import { serviceOrderKeys } from "@/features/service-orders/hooks/query-keys";
import type { ServiceOrderFormValues } from "@/features/service-orders/lib/service-order-form-values";
import type {
  ServiceOrderStatus,
  ServiceOrderStatusBaseType,
  ServiceOrderStatusVariant,
} from "@/features/service-orders/types/service-order-status";
import { useCatalogScope } from "@/lib/organization-context";

export function useServiceOrderMutations() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: serviceOrderKeys.all(scope) });

  return {
    create: useMutation({
      mutationFn: (values: ServiceOrderFormValues) =>
        createServiceOrderApi(formValuesToWritable(values)),
      onSuccess: async () => {
        await invalidate();
        toast.success("Ordem de serviço criada.");
      },
      onError: (e: Error) =>
        toast.error(e.message || "Erro ao criar ordem de serviço."),
    }),
    update: useMutation({
      mutationFn: ({
        id,
        values,
      }: {
        id: string;
        values: ServiceOrderFormValues;
      }) => updateServiceOrderApi(id, formValuesToWritable(values)),
      onSuccess: async () => {
        await invalidate();
        toast.success("Ordem de serviço atualizada.");
      },
      onError: (e: Error) =>
        toast.error(e.message || "Erro ao atualizar ordem de serviço."),
    }),
    generateSale: useMutation({
      mutationFn: generateSaleFromServiceOrderApi,
      onSuccess: async (result) => {
        await invalidate();
        toast.success(`Venda #${result.saleNumber} gerada.`);
      },
      onError: (e: Error) =>
        toast.error(e.message || "Erro ao gerar venda da OS."),
    }),
    createStatus: useMutation({
      mutationFn: (input: {
        name: string;
        baseType: ServiceOrderStatusBaseType;
        sortOrder?: number;
        variant?: ServiceOrderStatusVariant;
        active?: boolean;
      }) => createServiceOrderStatusApi(input),
      onSuccess: async () => {
        await invalidate();
        toast.success("Status criado.");
      },
      onError: (e: Error) => toast.error(e.message || "Erro ao criar status."),
    }),
    updateStatus: useMutation({
      mutationFn: ({
        id,
        ...input
      }: {
        id: string;
        name: string;
        baseType: ServiceOrderStatusBaseType;
        sortOrder?: number;
        variant?: ServiceOrderStatusVariant;
        active?: boolean;
      }) => updateServiceOrderStatusApi(id, input),
      onSuccess: async () => {
        await invalidate();
        toast.success("Status atualizado.");
      },
      onError: (e: Error) =>
        toast.error(e.message || "Erro ao atualizar status."),
    }),
    deleteStatus: useMutation({
      mutationFn: deleteServiceOrderStatusApi,
      onSuccess: async () => {
        await invalidate();
        toast.success("Status excluído.");
      },
      onError: (e: Error) =>
        toast.error(e.message || "Erro ao excluir status."),
    }),
    /**
     * Bugfix (2026-08-20, achado em teste manual): o drawer de status
     * reordenava só um cache local em memória (`service-order-status.service`)
     * — a ordem nunca era persistida, e a checagem de "status em uso" ao
     * excluir também rodava contra esse cache morto, então quase nunca
     * bloqueava de verdade. Não há endpoint de reordenação em lote — grava
     * `sortOrder` com `PUT` por status alterado, num único toast/invalidate.
     */
    reorderStatuses: useMutation({
      mutationFn: (statuses: ServiceOrderStatus[]) =>
        Promise.all(
          statuses.map((status) =>
            updateServiceOrderStatusApi(status.id, {
              name: status.name,
              baseType: status.baseType,
              sortOrder: status.sortOrder,
              variant: status.variant,
              active: status.active,
            }),
          ),
        ),
      onSuccess: async () => {
        await invalidate();
        toast.success("Ordem dos status atualizada.");
      },
      onError: (e: Error) =>
        toast.error(e.message || "Erro ao reordenar status."),
    }),
  };
}
