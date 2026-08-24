"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@citybox/mui";
import { useCatalogScope } from "@/lib/organization-context";
import { productKeys } from "@/features/products/hooks/query-keys";
import { technicalSheetKeys } from "@/features/technical-sheets/hooks/query-keys";
import {
  bulkDeleteProducts,
  createProduct,
  deleteProduct,
  duplicateProduct,
  restoreProduct,
  updateProduct,
} from "@/features/products/api/products.service";
import type { SaveProductPayload } from "@/features/products/api/product.dto";
import { ComercioApiError } from "@/lib/api/comercio-client";

function errorMessage(error: unknown): string {
  if (error instanceof ComercioApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Erro inesperado";
}

function invalidateCatalogProductConsumers(
  queryClient: ReturnType<typeof useQueryClient>,
  scope: string,
) {
  void queryClient.invalidateQueries({
    queryKey: productKeys.all(scope),
  });
  // Preço/nome da ficha técnica vêm do Product — invalida para não stalear.
  void queryClient.invalidateQueries({
    queryKey: technicalSheetKeys.all(scope),
  });
}

export function useCreateProductMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SaveProductPayload) =>
      createProduct(payload),
    onSuccess: (product) => {
      invalidateCatalogProductConsumers(queryClient, scope);
      toast.success("Produto criado", { description: product.name });
    },
    onError: (error) => {
      toast.error("Não foi possível criar o produto", {
        description: errorMessage(error),
      });
    },
  });
}

export function useUpdateProductMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SaveProductPayload }) =>
      updateProduct(id, payload),
    onSuccess: (product) => {
      invalidateCatalogProductConsumers(queryClient, scope);
      toast.success("Produto salvo", { description: product.name });
    },
    onError: (error) => {
      toast.error("Não foi possível salvar o produto", {
        description: errorMessage(error),
      });
    },
  });
}

export function useDeleteProductMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      invalidateCatalogProductConsumers(queryClient, scope);
      toast.success("Produto excluído", {
        description: "Ele continua disponível na aba Excluídos.",
      });
    },
    onError: (error) => {
      toast.error("Não foi possível excluir o produto", {
        description: errorMessage(error),
      });
    },
  });
}

export function useRestoreProductMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => restoreProduct(id),
    onSuccess: (product) => {
      invalidateCatalogProductConsumers(queryClient, scope);
      toast.success("Produto restaurado", { description: product.name });
    },
    onError: (error) => {
      toast.error("Não foi possível restaurar o produto", {
        description: errorMessage(error),
      });
    },
  });
}

export function useBulkDeleteProductsMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => bulkDeleteProducts(ids),
    onSuccess: (affected) => {
      invalidateCatalogProductConsumers(queryClient, scope);
      toast.success(
        affected === 1 ? "1 produto excluído" : `${affected} produtos excluídos`,
      );
    },
    onError: (error) => {
      toast.error("Não foi possível excluir os produtos", {
        description: errorMessage(error),
      });
    },
  });
}

export function useDuplicateProductMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => duplicateProduct(id),
    onSuccess: (product) => {
      invalidateCatalogProductConsumers(queryClient, scope);
      toast.success("Produto duplicado", { description: product.name });
    },
    onError: (error) => {
      toast.error("Não foi possível duplicar o produto", {
        description: errorMessage(error),
      });
    },
  });
}
