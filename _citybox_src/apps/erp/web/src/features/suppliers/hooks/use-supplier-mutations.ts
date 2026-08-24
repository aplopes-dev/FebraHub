"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@citybox/mui";
import { useCatalogScope } from "@/lib/organization-context";
import { ComercioApiError } from "@/lib/api/comercio-client";
import {
  createSupplier,
  deleteSupplier,
  restoreSupplier,
  updateSupplier,
} from "@/features/suppliers/api/suppliers.service";
import type { SaveSupplierPayload } from "@/features/suppliers/api/supplier.dto";
import { supplierKeys } from "@/features/suppliers/hooks/query-keys";

function errorMessage(error: unknown): string {
  if (error instanceof ComercioApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Erro inesperado";
}

export function useCreateSupplierMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SaveSupplierPayload) => createSupplier(payload),
    onSuccess: (supplier) => {
      void queryClient.invalidateQueries({ queryKey: supplierKeys.all(scope) });
      toast.success("Fornecedor criado", { description: supplier.name });
    },
    onError: (error) => {
      toast.error("Não foi possível criar o fornecedor", {
        description: errorMessage(error),
      });
    },
  });
}

export function useUpdateSupplierMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: SaveSupplierPayload;
    }) => updateSupplier(id, payload),
    onSuccess: (supplier) => {
      void queryClient.invalidateQueries({ queryKey: supplierKeys.all(scope) });
      toast.success("Fornecedor salvo", { description: supplier.name });
    },
    onError: (error) => {
      toast.error("Não foi possível salvar o fornecedor", {
        description: errorMessage(error),
      });
    },
  });
}

export function useDeleteSupplierMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSupplier(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: supplierKeys.all(scope) });
      toast.success("Fornecedor excluído", {
        description: "Ele continua disponível na aba Excluídos.",
      });
    },
    onError: (error) => {
      toast.error("Não foi possível excluir o fornecedor", {
        description: errorMessage(error),
      });
    },
  });
}

export function useRestoreSupplierMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => restoreSupplier(id),
    onSuccess: (supplier) => {
      void queryClient.invalidateQueries({ queryKey: supplierKeys.all(scope) });
      toast.success("Fornecedor restaurado", { description: supplier.name });
    },
    onError: (error) => {
      toast.error("Não foi possível restaurar o fornecedor", {
        description: errorMessage(error),
      });
    },
  });
}
