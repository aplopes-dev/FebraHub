'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { extractApiMessage } from '@/lib/api-error';
import { usersKeys } from '../api/query-keys';
import {
  createUser,
  updateUser,
  deleteUser,
  resendUserInvite,
} from '../api/users-api';
import type { CreateUserPayload, UpdateUserPayload } from '../types';

function useInvalidateUsers() {
  const queryClient = useQueryClient();

  return () =>
    queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
}

export function useCreateUserMutation() {
  const invalidateUsers = useInvalidateUsers();

  return useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),
    onSuccess: async () => {
      await invalidateUsers();
      toast.success('Convite enviado com sucesso!');
    },
  });
}

export function useUpdateUserMutation() {
  const invalidateUsers = useInvalidateUsers();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) =>
      updateUser(id, payload),
    onSuccess: async () => {
      await invalidateUsers();
      toast.success('Usuário atualizado.');
    },
  });
}

export function useDeleteUserMutation() {
  const invalidateUsers = useInvalidateUsers();

  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: async () => {
      await invalidateUsers();
      toast.success('Usuário removido.');
    },
    onError: (err) => {
      toast.error(extractApiMessage(err));
    },
  });
}

export function useResendInviteMutation() {
  return useMutation({
    mutationFn: async ({
      id,
    }: {
      id: string;
      label?: string;
    }) => {
      await resendUserInvite(id);
    },
    onSuccess: (_data, variables) => {
      const label = variables.label ?? 'usuário';
      toast.success(`Convite reenviado para ${label}.`);
    },
    onError: (err) => {
      toast.error(extractApiMessage(err));
    },
  });
}
