"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@citybox/mui";
import { useCatalogScope } from "@/lib/organization-context";
import { ComercioApiError } from "@/lib/api/comercio-client";
import {
  addOptionToVariation,
  createVariation,
  deleteVariation,
  updateVariation,
} from "@/features/variations/api/variations.service";
import { variationKeys } from "@/features/variations/hooks/query-keys";
import type {
  VariationFormValues,
  VariationOption,
} from "@/features/variations/types/variation";

function errorMessage(error: unknown): string {
  if (error instanceof ComercioApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Erro inesperado";
}

export function useCreateVariationMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: VariationFormValues) => createVariation(values),
    onSuccess: (variation) => {
      void queryClient.invalidateQueries({
        queryKey: variationKeys.all(scope),
      });
      toast.success("Variação criada", { description: variation.name });
    },
    onError: (error) => {
      toast.error("Não foi possível criar a variação", {
        description: errorMessage(error),
      });
    },
  });
}

export function useUpdateVariationMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: VariationFormValues;
    }) => updateVariation(id, values),
    onSuccess: (variation) => {
      void queryClient.invalidateQueries({
        queryKey: variationKeys.all(scope),
      });
      toast.success("Variação atualizada", { description: variation.name });
    },
    onError: (error) => {
      toast.error("Não foi possível salvar a variação", {
        description: errorMessage(error),
      });
    },
  });
}

export function useDeleteVariationMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteVariation(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: variationKeys.all(scope),
      });
      toast.success("Variação excluída");
    },
    onError: (error) => {
      toast.error("Não foi possível excluir a variação", {
        description: errorMessage(error),
      });
    },
  });
}

export function useAddOptionToVariationMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      variationId,
      option,
    }: {
      variationId: string;
      option: Omit<VariationOption, "sortOrder"> & { sortOrder?: number };
    }) => addOptionToVariation(variationId, option),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: variationKeys.all(scope),
      });
      toast.success("Opção adicionada");
    },
    onError: (error) => {
      toast.error("Não foi possível adicionar a opção", {
        description: errorMessage(error),
      });
    },
  });
}
