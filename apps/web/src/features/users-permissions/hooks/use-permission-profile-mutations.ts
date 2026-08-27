"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/ui";
import { useOrganization } from "@/lib/organization-context";
import { ApiError } from "@/lib/api/client";
import type { SavePermissionProfilePayload } from "@/features/users-permissions/api/permission-profile.dto";
import {
  createPermissionProfile,
  deletePermissionProfile,
  restorePermissionProfile,
  updatePermissionProfile,
} from "@/features/users-permissions/api/permission-profiles.service";
import {
  memberKeys,
  permissionProfileKeys,
} from "@/features/users-permissions/hooks/query-keys";

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Erro inesperado";
}

export function useCreatePermissionProfileMutation() {
  const { organizationId } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SavePermissionProfilePayload) =>
      createPermissionProfile(payload),
    onSuccess: (profile) => {
      void queryClient.invalidateQueries({
        queryKey: permissionProfileKeys.all(organizationId),
      });
      toast.success("Perfil de acesso criado", { description: profile.name });
    },
    onError: (error) => {
      toast.error("Não foi possível criar o perfil", {
        description: errorMessage(error),
      });
    },
  });
}

export function useUpdatePermissionProfileMutation() {
  const { organizationId } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: SavePermissionProfilePayload;
    }) => updatePermissionProfile(id, payload),
    onSuccess: (profile) => {
      void queryClient.invalidateQueries({
        queryKey: permissionProfileKeys.all(organizationId),
      });
      toast.success("Perfil de acesso salvo", { description: profile.name });
    },
    onError: (error) => {
      toast.error("Não foi possível salvar o perfil", {
        description: errorMessage(error),
      });
    },
  });
}

export function useDeletePermissionProfileMutation() {
  const { organizationId } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deletePermissionProfile(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: permissionProfileKeys.all(organizationId),
      });
      toast.success("Perfil de acesso excluído", {
        description: "Ele continua disponível na aba Excluídos.",
      });
    },
    onError: (error) => {
      toast.error("Não foi possível excluir o perfil", {
        description: errorMessage(error),
      });
    },
  });
}

export function useRestorePermissionProfileMutation() {
  const { organizationId } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => restorePermissionProfile(id),
    onSuccess: (profile) => {
      void queryClient.invalidateQueries({
        queryKey: permissionProfileKeys.all(organizationId),
      });
      // Membros podem voltar a listar o perfil restaurado.
      void queryClient.invalidateQueries({
        queryKey: memberKeys.all(organizationId),
      });
      toast.success("Perfil de acesso restaurado", {
        description: profile.name,
      });
    },
    onError: (error) => {
      toast.error("Não foi possível restaurar o perfil", {
        description: errorMessage(error),
      });
    },
  });
}
