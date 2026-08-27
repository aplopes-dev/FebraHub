"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/ui";
import { useCatalogScope } from "@/lib/organization-context";
import { ApiError } from "@/lib/api/client";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/features/categories/api/categories.service";
import type { SaveProductCategoryPayload } from "@/features/categories/api/category.dto";
import { categoryKeys } from "@/features/categories/hooks/query-keys";
import { productKeys } from "@/features/products/hooks/query-keys";

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Erro inesperado";
}

export function useCreateCategoryMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SaveProductCategoryPayload) =>
      createCategory(payload),
    onSuccess: (category) => {
      void queryClient.invalidateQueries({
        queryKey: categoryKeys.all(scope),
      });
      void queryClient.invalidateQueries({
        queryKey: productKeys.categories(scope),
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

export function useUpdateCategoryMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: SaveProductCategoryPayload;
    }) => updateCategory(id, payload),
    onSuccess: (category) => {
      void queryClient.invalidateQueries({
        queryKey: categoryKeys.all(scope),
      });
      void queryClient.invalidateQueries({
        queryKey: productKeys.categories(scope),
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

export function useDeleteCategoryMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: categoryKeys.all(scope),
      });
      void queryClient.invalidateQueries({
        queryKey: productKeys.categories(scope),
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
