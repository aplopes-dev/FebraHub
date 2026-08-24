"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@citybox/mui";
import { useCatalogScope } from "@/lib/organization-context";
import { ComercioApiError } from "@/lib/api/comercio-client";
import {
  createPriceList,
  deletePriceList,
  reorderPriceLists,
  replacePriceListItems,
  updatePriceList,
} from "@/features/price-lists/api/price-lists.service";
import { priceListKeys } from "@/features/price-lists/hooks/query-keys";
import { productKeys } from "@/features/products/hooks/query-keys";
import type {
  PriceListFormValues,
  PriceListItemPrice,
} from "@/features/price-lists/types/price-list";

function errorMessage(error: unknown): string {
  if (error instanceof ComercioApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Erro inesperado";
}

function invalidatePriceLists(
  queryClient: ReturnType<typeof useQueryClient>,
  scope: string,
) {
  void queryClient.invalidateQueries({ queryKey: priceListKeys.all(scope) });
  void queryClient.invalidateQueries({ queryKey: productKeys.all(scope) });
}

export function useCreatePriceListMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: PriceListFormValues) => createPriceList(values),
    onSuccess: (list) => {
      invalidatePriceLists(queryClient, scope);
      toast.success("Lista de preços criada", { description: list.name });
    },
    onError: (error) => {
      toast.error("Não foi possível criar a lista", {
        description: errorMessage(error),
      });
    },
  });
}

export function useUpdatePriceListMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: PriceListFormValues;
    }) => updatePriceList(id, values),
    onSuccess: (list) => {
      invalidatePriceLists(queryClient, scope);
      toast.success("Lista de preços atualizada", { description: list.name });
    },
    onError: (error) => {
      toast.error("Não foi possível salvar a lista", {
        description: errorMessage(error),
      });
    },
  });
}

export function useDeletePriceListMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deletePriceList(id),
    onSuccess: () => {
      invalidatePriceLists(queryClient, scope);
      toast.success("Lista de preços excluída");
    },
    onError: (error) => {
      toast.error("Não foi possível excluir a lista", {
        description: errorMessage(error),
      });
    },
  });
}

export function useReorderPriceListsMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderedIds: string[]) => reorderPriceLists(orderedIds),
    onSuccess: () => {
      invalidatePriceLists(queryClient, scope);
      toast.success("Prioridade das listas atualizada.");
    },
    onError: (error) => {
      toast.error("Não foi possível reordenar as listas", {
        description: errorMessage(error),
      });
    },
  });
}

export function useReplacePriceListItemsMutation(priceListId: string) {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (items: PriceListItemPrice[]) =>
      replacePriceListItems(priceListId, items),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: priceListKeys.items(scope, priceListId),
      });
      void queryClient.invalidateQueries({
        queryKey: priceListKeys.detail(scope, priceListId),
      });
      void queryClient.invalidateQueries({
        queryKey: priceListKeys.lists(scope),
      });
      void queryClient.invalidateQueries({
        queryKey: productKeys.all(scope),
      });
      toast.success("Preços salvos");
    },
    onError: (error) => {
      toast.error("Não foi possível salvar os preços", {
        description: errorMessage(error),
      });
    },
  });
}
