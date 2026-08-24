'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { extractApiMessage } from '@/lib/api-error';
import type {
  ChangeStorePlanBodyDto,
  UpdateStoreSettingsBodyDto,
  UpsertStoreMemberBodyDto,
} from '@/lib/admin-api';
import { storesKeys } from '../api/query-keys';
import {
  createStore,
  updateStore,
  blockStore,
  unblockStore,
  changeStorePlan,
  updateStoreSettings,
  updateStoreModule,
  createStoreMember,
  updateStoreMember,
  deleteStoreMember,
  resetStoreMemberPassword,
  resetStoreOwnerCredentials,
  provisionStore,
  sendStoreMemberPasswordLink,
} from '../api/stores-api';
import type { CreateStorePayload, UpsertStorePayload } from '../types';

function useInvalidateStores() {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.invalidateQueries({ queryKey: storesKeys.lists() });
  };
}

function useInvalidateStoreDetail(id: string) {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.invalidateQueries({ queryKey: storesKeys.detail(id) });
    await queryClient.invalidateQueries({ queryKey: storesKeys.auditLogs(id) });
  };
}

export function useCreateStoreMutation() {
  const invalidateStores = useInvalidateStores();

  return useMutation({
    mutationFn: (payload: CreateStorePayload) => createStore(payload),
    onSuccess: async () => {
      await invalidateStores();
      toast.success('Loja cadastrada com sucesso!');
    },
    onError: (err) => {
      toast.error(extractApiMessage(err));
    },
  });
}

export function useUpdateStoreMutation() {
  const queryClient = useQueryClient();
  const invalidateStores = useInvalidateStores();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpsertStorePayload }) =>
      updateStore(id, payload),
    onSuccess: async (data) => {
      await invalidateStores();
      await queryClient.invalidateQueries({ queryKey: storesKeys.detail(data.id) });
      toast.success('Loja atualizada.');
    },
    onError: (err) => {
      toast.error(extractApiMessage(err));
    },
  });
}

export function useBlockStoreMutation() {
  const queryClient = useQueryClient();
  const invalidateStores = useInvalidateStores();

  return useMutation({
    mutationFn: (id: string) => blockStore(id),
    onSuccess: async (data) => {
      await invalidateStores();
      queryClient.setQueryData(storesKeys.detail(data.id), data);
      toast.success('Loja bloqueada.');
    },
    onError: (err) => {
      toast.error(extractApiMessage(err));
    },
  });
}

export function useUnblockStoreMutation() {
  const queryClient = useQueryClient();
  const invalidateStores = useInvalidateStores();

  return useMutation({
    mutationFn: (id: string) => unblockStore(id),
    onSuccess: async (data) => {
      await invalidateStores();
      queryClient.setQueryData(storesKeys.detail(data.id), data);
      toast.success('Loja desbloqueada.');
    },
    onError: (err) => {
      toast.error(extractApiMessage(err));
    },
  });
}

export function useChangeStorePlanMutation(storeId: string) {
  const queryClient = useQueryClient();
  const invalidateDetail = useInvalidateStoreDetail(storeId);

  return useMutation({
    mutationFn: (payload: ChangeStorePlanBodyDto) => changeStorePlan(storeId, payload),
    onSuccess: async (data) => {
      queryClient.setQueryData(storesKeys.detail(storeId), data);
      await invalidateDetail();
      toast.success('Plano da loja atualizado.');
    },
    onError: (err) => {
      toast.error(extractApiMessage(err));
    },
  });
}

export function useUpdateStoreSettingsMutation(storeId: string) {
  const queryClient = useQueryClient();
  const invalidateDetail = useInvalidateStoreDetail(storeId);

  return useMutation({
    mutationFn: (payload: UpdateStoreSettingsBodyDto) => updateStoreSettings(storeId, payload),
    onSuccess: async (data) => {
      queryClient.setQueryData(storesKeys.detail(storeId), data);
      await invalidateDetail();
    },
    onError: (err) => {
      toast.error(extractApiMessage(err));
    },
  });
}

export function useUpdateStoreModuleMutation(storeId: string) {
  const queryClient = useQueryClient();
  const invalidateDetail = useInvalidateStoreDetail(storeId);

  return useMutation({
    mutationFn: ({ moduleKey, enabled }: { moduleKey: string; enabled: boolean }) =>
      updateStoreModule(storeId, moduleKey, enabled),
    onSuccess: async (data) => {
      queryClient.setQueryData(storesKeys.detail(storeId), data);
      await invalidateDetail();
      toast.success('Módulo atualizado.');
    },
    onError: (err) => {
      toast.error(extractApiMessage(err));
    },
  });
}

export function useCreateStoreMemberMutation(storeId: string) {
  const queryClient = useQueryClient();
  const invalidateDetail = useInvalidateStoreDetail(storeId);

  return useMutation({
    mutationFn: (payload: UpsertStoreMemberBodyDto) => createStoreMember(storeId, payload),
    onSuccess: async (data) => {
      queryClient.setQueryData(storesKeys.detail(storeId), data.detail);
      await invalidateDetail();
      if (!data.meta?.temporaryPassword && !data.meta?.inviteEmailSent) {
        toast.success('Usuário adicionado à loja.');
      }
    },
    onError: (err) => {
      toast.error(extractApiMessage(err));
    },
  });
}

// Não há mutation de criação em lote: vincular membros já existentes de outras
// lojas saiu na Fase 10 do PLAT-001, pois cada loja é um cliente independente.

export function useUpdateStoreMemberMutation(storeId: string) {
  const queryClient = useQueryClient();
  const invalidateDetail = useInvalidateStoreDetail(storeId);

  return useMutation({
    mutationFn: ({
      memberId,
      payload,
    }: {
      memberId: string;
      payload: UpsertStoreMemberBodyDto;
    }) => updateStoreMember(storeId, memberId, payload),
    onSuccess: async (data) => {
      queryClient.setQueryData(storesKeys.detail(storeId), data);
      await invalidateDetail();
      toast.success('Usuário atualizado.');
    },
    onError: (err) => {
      toast.error(extractApiMessage(err));
    },
  });
}

export function useDeleteStoreMemberMutation(storeId: string) {
  const queryClient = useQueryClient();
  const invalidateDetail = useInvalidateStoreDetail(storeId);

  return useMutation({
    mutationFn: (memberId: string) => deleteStoreMember(storeId, memberId),
    onSuccess: async (data) => {
      queryClient.setQueryData(storesKeys.detail(storeId), data);
      await invalidateDetail();
      toast.success('Acesso revogado.');
    },
    onError: (err) => {
      toast.error(extractApiMessage(err));
    },
  });
}

export function useResetStoreMemberPasswordMutation(storeId: string) {
  const queryClient = useQueryClient();
  const invalidateDetail = useInvalidateStoreDetail(storeId);

  return useMutation({
    mutationFn: (memberId: string) => resetStoreMemberPassword(storeId, memberId),
    onSuccess: async (data) => {
      queryClient.setQueryData(storesKeys.detail(storeId), data.detail);
      await invalidateDetail();
    },
    onError: (err) => {
      toast.error(extractApiMessage(err));
    },
  });
}

/**
 * Gera as credenciais do responsável pela organização na vertical.
 *
 * Sem `onSuccess` que grave a senha em cache: ela só pode existir no estado local do
 * diálogo que a exibe uma única vez. Guardar no React Query a deixaria sobrevivendo a
 * navegações e a devtools.
 */
export function useResetStoreOwnerCredentialsMutation(storeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => resetStoreOwnerCredentials(storeId),
    onSuccess: async () => {
      // Invalida só o responsável — nunca guarda a resposta. Depois de gerar a primeira
      // senha, `hasPassword` vira `true` na vertical e o botão precisa passar a dizer
      // "Resetar senha"; sem esta invalidação ele continuaria oferecendo "Gerar senha".
      await queryClient.invalidateQueries({
        queryKey: storesKeys.verticalOwner(storeId),
      });
    },
    onError: (err) => {
      toast.error(extractApiMessage(err));
    },
  });
}

/**
 * Provisiona a vertical sob demanda. A senha só vive no estado local do diálogo.
 */
export function useProvisionStoreMutation(storeId: string) {
  const queryClient = useQueryClient();
  const invalidateDetail = useInvalidateStoreDetail(storeId);

  return useMutation({
    mutationFn: () => provisionStore(storeId),
    onSuccess: async () => {
      await invalidateDetail();
      await queryClient.invalidateQueries({
        queryKey: storesKeys.verticalOwner(storeId),
      });
      toast.success('Loja provisionada com sucesso.');
    },
    onError: (err) => {
      void invalidateDetail();
      toast.error(extractApiMessage(err));
    },
  });
}

export function useSendStoreMemberPasswordLinkMutation(storeId: string) {
  const queryClient = useQueryClient();
  const invalidateDetail = useInvalidateStoreDetail(storeId);

  return useMutation({
    mutationFn: (memberId: string) => sendStoreMemberPasswordLink(storeId, memberId),
    onSuccess: async (data) => {
      queryClient.setQueryData(storesKeys.detail(storeId), data);
      await invalidateDetail();
      toast.success('Link de redefinição de senha enviado por e-mail.');
    },
    onError: (err) => {
      toast.error(extractApiMessage(err));
    },
  });
}
