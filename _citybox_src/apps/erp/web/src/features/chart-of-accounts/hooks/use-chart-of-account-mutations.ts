"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@citybox/mui";
import { useCatalogScope } from "@/lib/organization-context";
import { ComercioApiError } from "@/lib/api/comercio-client";
import {
  createChartOfAccount,
  deleteChartOfAccount,
  restoreChartOfAccount,
  updateChartOfAccount,
} from "@/features/chart-of-accounts/api/chart-of-accounts.service";
import type { SaveChartOfAccountPayload } from "@/features/chart-of-accounts/api/chart-of-account.dto";
import { chartOfAccountKeys } from "@/features/chart-of-accounts/hooks/query-keys";

function errorMessage(error: unknown): string {
  if (error instanceof ComercioApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Erro inesperado";
}

export function useCreateChartOfAccountMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SaveChartOfAccountPayload) =>
      createChartOfAccount(payload),
    onSuccess: (account) => {
      void queryClient.invalidateQueries({
        queryKey: chartOfAccountKeys.all(scope),
      });
      toast.success("Plano de contas criado", { description: account.name });
    },
    onError: (error) => {
      toast.error("Não foi possível criar o plano de contas", {
        description: errorMessage(error),
      });
    },
  });
}

export function useUpdateChartOfAccountMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: SaveChartOfAccountPayload;
    }) => updateChartOfAccount(id, payload),
    onSuccess: (account) => {
      void queryClient.invalidateQueries({
        queryKey: chartOfAccountKeys.all(scope),
      });
      toast.success("Plano de contas atualizado", {
        description: account.name,
      });
    },
    onError: (error) => {
      toast.error("Não foi possível atualizar o plano de contas", {
        description: errorMessage(error),
      });
    },
  });
}

export function useDeleteChartOfAccountMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteChartOfAccount(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: chartOfAccountKeys.all(scope),
      });
      toast.success("Plano de contas excluído", {
        description: "Ele continua disponível na aba Excluídos.",
      });
    },
    onError: (error) => {
      toast.error("Não foi possível excluir o plano de contas", {
        description: errorMessage(error),
      });
    },
  });
}

export function useRestoreChartOfAccountMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => restoreChartOfAccount(id),
    onSuccess: (account) => {
      void queryClient.invalidateQueries({
        queryKey: chartOfAccountKeys.all(scope),
      });
      toast.success("Plano de contas restaurado", {
        description: account.name,
      });
    },
    onError: (error) => {
      toast.error("Não foi possível restaurar o plano de contas", {
        description: errorMessage(error),
      });
    },
  });
}
