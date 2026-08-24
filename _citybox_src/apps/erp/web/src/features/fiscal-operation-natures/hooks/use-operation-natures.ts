"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@citybox/mui";
import { useCatalogScope } from "@/lib/organization-context";
import { businessErrorMessage } from "@/lib/api/business-error-message";
import {
  createOperationNatureApi,
  deleteOperationNatureApi,
  getOperationNatureApi,
  listOperationNaturesApi,
  updateOperationNatureApi,
} from "../api/operation-nature.service";
import type { UpsertOperationNaturePayload } from "../api/operation-nature.dto";

const KEY = "fiscal-operation-natures";

export function operationNatureKeys(scope: string) {
  return {
    all: ["comercio", KEY, scope] as const,
    list: ["comercio", KEY, scope, "list"] as const,
    detail: (id: string) => ["comercio", KEY, scope, "detail", id] as const,
  };
}

export function useOperationNaturesQuery() {
  const { scope, ready } = useCatalogScope();
  return useQuery({
    queryKey: operationNatureKeys(scope).list,
    queryFn: listOperationNaturesApi,
    enabled: ready,
  });
}

export function useOperationNatureQuery(id: string | null) {
  const { scope, ready } = useCatalogScope();
  return useQuery({
    queryKey: operationNatureKeys(scope).detail(id ?? ""),
    queryFn: () => getOperationNatureApi(id as string),
    enabled: ready && Boolean(id),
  });
}

export function useCreateOperationNatureMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertOperationNaturePayload) =>
      createOperationNatureApi(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: operationNatureKeys(scope).all }),
  });
}

export function useUpdateOperationNatureMutation(id: string) {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertOperationNaturePayload) =>
      updateOperationNatureApi(id, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: operationNatureKeys(scope).all }),
  });
}

export function useDeleteOperationNatureMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteOperationNatureApi(id),
    onSuccess: () => {
      // Mesma chave que a listagem e o card de contagem em Padrões fiscais
      // já leem — invalidar aqui decrementa os dois sozinho.
      queryClient.invalidateQueries({ queryKey: operationNatureKeys(scope).all });
      toast.success("Natureza de operação excluída.");
    },
    onError: (error) => {
      toast.error("Não foi possível excluir a natureza de operação", {
        description: businessErrorMessage(
          error,
          "Tente novamente em instantes.",
        ),
      });
    },
  });
}
