"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/ui";
import { useCatalogScope } from "@/lib/organization-context";
import { ApiError } from "@/lib/api/client";
import {
  createFinancialEntryApi,
  deleteFinancialEntryApi,
  restoreFinancialEntryApi,
  updateFinancialEntryApi,
} from "@/features/financial-entries/api/financial-entries.service";
import { financialEntryKeys } from "@/features/financial-entries/hooks/query-keys";
import type { FinancialEntryFormValues } from "@/features/financial-entries/lib/financial-entry-form-values";

/**
 * Mensagens específicas para os erros que o backend pode devolver ao salvar
 * (422 de rateio que não fecha, 403 de lançamento travado por venda, 404 de
 * FK inválida) — em vez do texto genérico da API.
 */
function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 422) {
      return (
        error.message ||
        "O rateio por categoria precisa somar o valor total do lançamento."
      );
    }
    if (error.status === 403) {
      return "Este lançamento foi gerado por um pedido de venda e não pode ser editado.";
    }
    if (error.status === 404) {
      return (
        error.message ||
        "Uma das contas/categorias/pessoas selecionadas não pertence a esta empresa."
      );
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "Erro inesperado";
}

export function useCreateFinancialEntryMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: FinancialEntryFormValues) =>
      createFinancialEntryApi(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: financialEntryKeys.all(scope),
      });
      toast.success("Lançamento criado.");
    },
    onError: (error) => {
      toast.error("Não foi possível criar o lançamento", {
        description: errorMessage(error),
      });
    },
  });
}

export function useUpdateFinancialEntryMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: FinancialEntryFormValues;
    }) => updateFinancialEntryApi(id, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: financialEntryKeys.all(scope),
      });
      toast.success("Lançamento atualizado.");
    },
    onError: (error) => {
      toast.error("Não foi possível atualizar o lançamento", {
        description: errorMessage(error),
      });
    },
  });
}

export function useDeleteFinancialEntryMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteFinancialEntryApi(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: financialEntryKeys.all(scope),
      });
      toast.success("Lançamento excluído.");
    },
    onError: (error) => {
      toast.error("Não foi possível excluir o lançamento", {
        description: errorMessage(error),
      });
    },
  });
}

export function useRestoreFinancialEntryMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => restoreFinancialEntryApi(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: financialEntryKeys.all(scope),
      });
      toast.success("Lançamento restaurado.");
    },
    onError: (error) => {
      toast.error("Não foi possível restaurar o lançamento", {
        description: errorMessage(error),
      });
    },
  });
}
