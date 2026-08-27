"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/ui";
import { useOrganization } from "@/lib/organization-context";
import { ApiError } from "@/lib/api/client";
import {
  createBranchApi,
  createMatrixApi,
  deleteBranchApi,
  deleteMatrixApi,
  updateBranchApi,
  updateMatrixApi,
} from "@/features/branches/api/branches.service";
import type {
  CreateBranchPayload,
  UpdateBranchPayload,
} from "@/features/branches/api/branch.dto";
import { branchKeys } from "@/features/branches/hooks/query-keys";

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Erro inesperado";
}

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

export function useCreateMatrixMutation() {
  const refresh = useBranchCacheRefresh();

  return useMutation({
    mutationFn: (payload: CreateBranchPayload) => createMatrixApi(payload),
    onSuccess: (matrix) => {
      refresh();
      toast.success("Empresa matriz criada", { description: matrix.displayName });
    },
    onError: (error) => {
      toast.error("Não foi possível criar a empresa matriz", {
        description: errorMessage(error),
      });
    },
  });
}

export function useCreateBranchMutation() {
  const refresh = useBranchCacheRefresh();

  return useMutation({
    mutationFn: (payload: CreateBranchPayload) => createBranchApi(payload),
    onSuccess: (branch) => {
      refresh();
      toast.success("Loja criada", { description: branch.displayName });
    },
    onError: (error) => {
      toast.error("Não foi possível criar a loja", {
        description: errorMessage(error),
      });
    },
  });
}

export function useUpdateMatrixMutation() {
  const refresh = useBranchCacheRefresh();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateBranchPayload }) =>
      updateMatrixApi(id, payload),
    onSuccess: (matrix) => {
      refresh();
      toast.success("Empresa matriz salva", { description: matrix.displayName });
    },
    onError: (error) => {
      toast.error("Não foi possível salvar a empresa matriz", {
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
      toast.success("Loja salva", { description: branch.displayName });
    },
    onError: (error) => {
      toast.error("Não foi possível salvar a loja", {
        description: errorMessage(error),
      });
    },
  });
}

export function useDeleteMatrixMutation() {
  const refresh = useBranchCacheRefresh();

  return useMutation({
    mutationFn: (id: string) => deleteMatrixApi(id),
    onSuccess: () => {
      refresh();
      toast.success("Empresa matriz desativada");
    },
    onError: (error) => {
      toast.error("Não foi possível desativar a empresa matriz", {
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
      toast.success("Loja desativada", {
        description:
          "Ela sai das listagens, mas as notas e movimentos já emitidos continuam apontando para ela.",
      });
    },
    onError: (error) => {
      toast.error("Não foi possível desativar a loja", {
        description: errorMessage(error),
      });
    },
  });
}
