"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@citybox/mui";
import { useCatalogScope } from "@/lib/organization-context";
import { ComercioApiError } from "@/lib/api/comercio-client";
import {
  createCustomerCategory,
  deleteCustomerCategory,
  updateCustomerCategory,
} from "@/features/customer-categories/api/customer-categories.service";
import type { SaveCustomerCategoryPayload } from "@/features/customers/api/customer.dto";
import { customerCategoryKeys } from "@/features/customers/hooks/query-keys";

function errorMessage(error: unknown): string {
  if (error instanceof ComercioApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Erro inesperado";
}

export function useCreateCustomerCategoryMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SaveCustomerCategoryPayload) =>
      createCustomerCategory(payload),
    onSuccess: (category) => {
      void queryClient.invalidateQueries({
        queryKey: customerCategoryKeys.all(scope),
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

export function useUpdateCustomerCategoryMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: SaveCustomerCategoryPayload;
    }) => updateCustomerCategory(id, payload),
    onSuccess: (category) => {
      void queryClient.invalidateQueries({
        queryKey: customerCategoryKeys.all(scope),
      });
      toast.success("Categoria atualizada", { description: category.name });
    },
    onError: (error) => {
      toast.error("Não foi possível atualizar a categoria", {
        description: errorMessage(error),
      });
    },
  });
}

export function useDeleteCustomerCategoryMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCustomerCategory(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: customerCategoryKeys.all(scope),
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
