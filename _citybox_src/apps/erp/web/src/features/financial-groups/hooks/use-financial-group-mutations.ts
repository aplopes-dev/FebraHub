"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@citybox/mui";
import { useCatalogScope } from "@/lib/organization-context";
import { ComercioApiError } from "@/lib/api/comercio-client";
import {
  createFinancialGroup,
  deleteFinancialGroup,
  restoreFinancialGroup,
  updateFinancialGroup,
} from "@/features/financial-groups/api/financial-groups.service";
import type { SaveFinancialGroupPayload } from "@/features/financial-groups/api/financial-group.dto";
import { financialGroupKeys } from "@/features/financial-groups/hooks/query-keys";

function errorMessage(error: unknown): string {
  if (error instanceof ComercioApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Erro inesperado";
}

export function useCreateFinancialGroupMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SaveFinancialGroupPayload) =>
      createFinancialGroup(payload),
    onSuccess: (group) => {
      void queryClient.invalidateQueries({
        queryKey: financialGroupKeys.all(scope),
      });
      toast.success("Grupo financeiro criado", { description: group.name });
    },
    onError: (error) => {
      toast.error("Não foi possível criar o grupo financeiro", {
        description: errorMessage(error),
      });
    },
  });
}

export function useUpdateFinancialGroupMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: SaveFinancialGroupPayload;
    }) => updateFinancialGroup(id, payload),
    onSuccess: (group) => {
      void queryClient.invalidateQueries({
        queryKey: financialGroupKeys.all(scope),
      });
      toast.success("Grupo financeiro atualizado", {
        description: group.name,
      });
    },
    onError: (error) => {
      toast.error("Não foi possível atualizar o grupo financeiro", {
        description: errorMessage(error),
      });
    },
  });
}

export function useDeleteFinancialGroupMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteFinancialGroup(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: financialGroupKeys.all(scope),
      });
      toast.success("Grupo financeiro excluído", {
        description: "Ele continua disponível na aba Excluídos.",
      });
    },
    onError: (error) => {
      toast.error("Não foi possível excluir o grupo financeiro", {
        description: errorMessage(error),
      });
    },
  });
}

export function useRestoreFinancialGroupMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => restoreFinancialGroup(id),
    onSuccess: (group) => {
      void queryClient.invalidateQueries({
        queryKey: financialGroupKeys.all(scope),
      });
      toast.success("Grupo financeiro restaurado", {
        description: group.name,
      });
    },
    onError: (error) => {
      toast.error("Não foi possível restaurar o grupo financeiro", {
        description: errorMessage(error),
      });
    },
  });
}
