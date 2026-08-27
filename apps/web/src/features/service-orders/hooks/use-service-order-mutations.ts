"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/ui";
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
import type { ServiceOrderStatusBaseType } from "@/features/service-orders/types/service-order-status";
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
  };
}
