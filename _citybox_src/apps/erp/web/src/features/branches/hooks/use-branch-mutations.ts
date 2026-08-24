"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@citybox/mui";
import { useOrganization } from "@/lib/organization-context";
import { ComercioApiError } from "@/lib/api/comercio-client";
import {
  createBranchApi,
  deleteBranchApi,
  updateBranchApi,
} from "@/features/branches/api/branches.service";
import type {
  CreateBranchPayload,
  UpdateBranchPayload,
} from "@/features/branches/api/branch.dto";
import { branchKeys } from "@/features/branches/hooks/query-keys";

function errorMessage(error: unknown): string {
  if (error instanceof ComercioApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Erro inesperado";
}

/**
 * Invalida o cache das unidades e recarrega o contexto de tenancy — o seletor
 * de unidade do header vem de lá, não do React Query.
 */
function useBranchCacheRefresh() {
  const { organizationId, reload } = useOrganization();
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({
      queryKey: branchKeys.all(organizationId),
    });
    reload();
  };
}

export function useCreateBranchMutation() {
  const refresh = useBranchCacheRefresh();

  return useMutation({
    mutationFn: (payload: CreateBranchPayload) => createBranchApi(payload),
    onSuccess: (branch) => {
      refresh();
      toast.success("Unidade criada", { description: branch.displayName });
    },
    onError: (error) => {
      toast.error("Não foi possível criar a unidade", {
        description: errorMessage(error),
      });
    },
  });
}

export function useUpdateBranchMutation() {
  const refresh = useBranchCacheRefresh();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateBranchPayload }) =>
      updateBranchApi(id, payload),
    onSuccess: (branch) => {
      refresh();
      toast.success("Unidade salva", { description: branch.displayName });
    },
    onError: (error) => {
      toast.error("Não foi possível salvar a unidade", {
        description: errorMessage(error),
      });
    },
  });
}

export function useDeleteBranchMutation() {
  const refresh = useBranchCacheRefresh();

  return useMutation({
    mutationFn: (id: string) => deleteBranchApi(id),
    onSuccess: () => {
      refresh();
      toast.success("Unidade desativada", {
        description:
          "Ela sai das listagens, mas as notas e movimentos já emitidos continuam apontando para ela.",
      });
    },
    onError: (error) => {
      toast.error("Não foi possível desativar a unidade", {
        description: errorMessage(error),
      });
    },
  });
}
