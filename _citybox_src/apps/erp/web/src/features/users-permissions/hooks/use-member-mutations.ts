"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@citybox/mui";
import { useOrganization } from "@/lib/organization-context";
import { ComercioApiError } from "@/lib/api/comercio-client";
import type {
  CreateMemberPayload,
  SetMemberPdvPinPayload,
  UpdateMemberPayload,
} from "@/features/users-permissions/api/member.dto";
import {
  createMember,
  deactivateMember,
  reactivateMember,
  resetMemberPassword,
  setMemberPdvPin,
  updateMember,
} from "@/features/users-permissions/api/members.service";
import { memberKeys } from "@/features/users-permissions/hooks/query-keys";

function errorMessage(error: unknown): string {
  if (error instanceof ComercioApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Erro inesperado";
}

export function useCreateMemberMutation() {
  const { organizationId } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateMemberPayload) => createMember(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: memberKeys.all(organizationId),
      });
    },
    onError: (error) => {
      toast.error("Não foi possível criar o usuário", {
        description: errorMessage(error),
      });
    },
  });
}

export function useUpdateMemberMutation() {
  const { organizationId } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateMemberPayload;
    }) => updateMember(id, payload),
    onSuccess: (member) => {
      void queryClient.invalidateQueries({
        queryKey: memberKeys.all(organizationId),
      });
      toast.success("Usuário salvo", { description: member.name });
    },
    onError: (error) => {
      toast.error("Não foi possível salvar o usuário", {
        description: errorMessage(error),
      });
    },
  });
}

export function useDeactivateMemberMutation() {
  const { organizationId } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deactivateMember(id),
    onSuccess: (member) => {
      void queryClient.invalidateQueries({
        queryKey: memberKeys.all(organizationId),
      });
      toast.success("Usuário excluído", {
        description: `${member.name} continua disponível na aba Excluídos.`,
      });
    },
    onError: (error) => {
      toast.error("Não foi possível excluir o usuário", {
        description: errorMessage(error),
      });
    },
  });
}

export function useReactivateMemberMutation() {
  const { organizationId } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => reactivateMember(id),
    onSuccess: (member) => {
      void queryClient.invalidateQueries({
        queryKey: memberKeys.all(organizationId),
      });
      toast.success("Usuário restaurado", { description: member.name });
    },
    onError: (error) => {
      toast.error("Não foi possível restaurar o usuário", {
        description: errorMessage(error),
      });
    },
  });
}

export function useResetMemberPasswordMutation() {
  return useMutation({
    mutationFn: (id: string) => resetMemberPassword(id),
    onError: (error) => {
      toast.error("Não foi possível resetar a senha", {
        description: errorMessage(error),
      });
    },
  });
}

export function useSetMemberPdvPinMutation() {
  const { organizationId } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: SetMemberPdvPinPayload;
    }) => setMemberPdvPin(id, payload),
    onSuccess: (member) => {
      void queryClient.invalidateQueries({
        queryKey: memberKeys.all(organizationId),
      });
      toast.success("PIN do PDV definido", { description: member.name });
    },
    onError: (error) => {
      toast.error("Não foi possível definir o PIN", {
        description: errorMessage(error),
      });
    },
  });
}
