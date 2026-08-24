"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useStore } from "@/lib/store-context";
import { toastClinicaMutationError } from "@/features/clinic/shared/api";
import { teamKeys } from "@/features/shared/team/query-keys";
import {
  createTeamMember,
  deleteTeamMember,
  listTeamMembers,
  listTeamRoles,
  resetTeamMemberPassword,
  updateTeamMember,
  updateTeamMemberStatus,
} from "@/features/shared/team/team-members.service";
import type {
  CreatedTeamMember,
  ResetPasswordResult,
  TeamMember,
  TeamMemberFormValues,
  TeamRole,
} from "@/features/shared/team/types";

/**
 * Hook de gestão de equipe da clínica. Lê o `storeId` da loja ativa (`useStore` — que
 * desde a Fase 9 é o `clinicId`) e expõe queries + mutations contra `/v1/members` da
 * própria `clinica-api`. A UI fica a cargo de cada tela.
 */
export function useTeamMembers() {
  const { storeId } = useStore();
  const queryClient = useQueryClient();

  const membersQuery = useQuery({
    queryKey: teamKeys.members(storeId),
    queryFn: () => listTeamMembers(storeId),
    enabled: Boolean(storeId),
  });

  const rolesQuery = useQuery({
    queryKey: teamKeys.roles(storeId),
    queryFn: () => listTeamRoles(storeId),
    enabled: Boolean(storeId),
  });

  const invalidateMembers = useCallback(
    () =>
      queryClient.invalidateQueries({ queryKey: teamKeys.members(storeId) }),
    [queryClient, storeId],
  );

  const createMutation = useMutation({
    mutationFn: (values: TeamMemberFormValues) =>
      createTeamMember(storeId, values),
    onSuccess: () => {
      void invalidateMembers();
      toast.success("Membro adicionado.");
    },
    onError: (error) =>
      toastClinicaMutationError(error, "Não foi possível adicionar o membro."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: TeamMemberFormValues }) =>
      updateTeamMember(storeId, id, values),
    onSuccess: () => {
      void invalidateMembers();
      toast.success("Membro atualizado.");
    },
    onError: (error) =>
      toastClinicaMutationError(error, "Não foi possível atualizar o membro."),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => deleteTeamMember(storeId, id),
    onSuccess: () => {
      void invalidateMembers();
      toast.success("Membro removido.");
    },
    onError: (error) =>
      toastClinicaMutationError(error, "Não foi possível remover o membro."),
  });

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "active" | "inactive";
    }) => updateTeamMemberStatus(storeId, id, status),
    onSuccess: (_data, variables) => {
      void invalidateMembers();
      toast.success(
        variables.status === "inactive"
          ? "Membro desativado."
          : "Membro reativado.",
      );
    },
    onError: (error) =>
      toastClinicaMutationError(
        error,
        "Não foi possível atualizar o status do membro.",
      ),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (id: string) => resetTeamMemberPassword(storeId, id),
    onSuccess: () => {
      void invalidateMembers();
      toast.success("Nova senha provisória gerada.");
    },
    onError: (error) =>
      toastClinicaMutationError(error, "Não foi possível gerar a senha."),
  });

  const createMember = useCallback(
    (values: TeamMemberFormValues): Promise<CreatedTeamMember> =>
      createMutation.mutateAsync(values),
    [createMutation],
  );

  const updateMember = useCallback(
    (id: string, values: TeamMemberFormValues): Promise<TeamMember> =>
      updateMutation.mutateAsync({ id, values }),
    [updateMutation],
  );

  const removeMember = useCallback(
    (id: string): Promise<void> => removeMutation.mutateAsync(id),
    [removeMutation],
  );

  const setMemberStatus = useCallback(
    (id: string, status: "active" | "inactive"): Promise<void> =>
      statusMutation.mutateAsync({ id, status }),
    [statusMutation],
  );

  const resetPassword = useCallback(
    (id: string): Promise<ResetPasswordResult> =>
      resetPasswordMutation.mutateAsync(id),
    [resetPasswordMutation],
  );

  const members: TeamMember[] = membersQuery.data ?? [];
  const roles: TeamRole[] = rolesQuery.data ?? [];

  return {
    members,
    roles,
    isLoading: membersQuery.isPending,
    isError: membersQuery.isError,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    isResettingPassword: resetPasswordMutation.isPending,
    isRemoving: removeMutation.isPending,
    createMember,
    updateMember,
    removeMember,
    setMemberStatus,
    resetPassword,
  };
}
