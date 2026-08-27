"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/ui";
import { useCatalogScope } from "@/lib/organization-context";
import { ApiError } from "@/lib/api/client";
import {
  createMovementCategoryApi,
  deleteMovementCategoryApi,
  updateMovementCategoryApi,
} from "@/features/movement-categories/api/movement-categories.service";
import type { SaveMovementCategoryPayload } from "@/features/movement-categories/api/movement-category.dto";
import { movementCategoryKeys } from "@/features/movement-categories/hooks/query-keys";

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Erro inesperado";
}

export function useCreateMovementCategoryMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SaveMovementCategoryPayload) =>
      createMovementCategoryApi(payload),
    onSuccess: (category) => {
      void queryClient.invalidateQueries({
        queryKey: movementCategoryKeys.all(scope),
      });
      toast.success("Categoria criada", { description: category.name });
    },
    onError: (error) => {
      toast.error("Não foi possível criar a categoria", {
        description: errorMessage(error),
      });
    },
  });
}

export function useUpdateMovementCategoryMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: SaveMovementCategoryPayload;
    }) => updateMovementCategoryApi(id, payload),
    onSuccess: (category) => {
      void queryClient.invalidateQueries({
        queryKey: movementCategoryKeys.all(scope),
      });
      toast.success("Categoria atualizada", { description: category.name });
    },
    onError: (error) => {
      toast.error("Não foi possível salvar a categoria", {
        description: errorMessage(error),
      });
    },
  });
}

export function useDeleteMovementCategoryMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteMovementCategoryApi(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: movementCategoryKeys.all(scope),
      });
      toast.success("Categoria excluída");
    },
    onError: (error) => {
      toast.error("Não foi possível excluir a categoria", {
        description: errorMessage(error),
      });
    },
  });
}
