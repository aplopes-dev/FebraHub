"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "@/lib/api/http-client";
import {
  conversationsListPrefix,
  upsertConversationInLists,
} from "@/hooks/conversations/use-conversations";
import { conversationsUnreadCountQueryKey } from "@/hooks/conversations/use-conversations-unread-count";
import type {
  ConversationDto,
  ConversationStatus,
} from "@/types/api/conversation";

type ConversationResponse = { conversation: ConversationDto };

/** Find-or-create de conversa por telefone (diálogo "nova conversa"). */
export function useCreateConversationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { phone: string; name?: string }) => {
      const { data } = await httpClient.post<ConversationResponse>(
        "/backend/conversations",
        input,
      );
      return data.conversation;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: conversationsListPrefix });
    },
  });
}

/** Cria grupo WhatsApp + conversa no inbox (+ descrição e foto opcionais). */
export function useCreateWhatsappGroupMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      subject: string;
      participantPhones: string[];
      description?: string;
      pictureDataUrl?: string;
    }) => {
      const { data } = await httpClient.post<{
        conversation: ConversationDto;
        inviteLink: string | null;
        warning: string | null;
      }>("/backend/conversations/groups", input);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: conversationsListPrefix });
    },
  });
}

export type AddGroupParticipantsResult = {
  results: Array<{ phone: string; jid: string | null; status: string }>;
  inviteCode: string | null;
  inviteLink: string | null;
  inviteMessagesSent: number;
  warning: string | null;
};

/** Adiciona telefones a um grupo já existente no inbox. */
export function useAddGroupParticipantsMutation() {
  return useMutation({
    mutationFn: async ({
      conversationId,
      participantPhones,
    }: {
      conversationId: string;
      participantPhones: string[];
    }) => {
      const { data } = await httpClient.post<AddGroupParticipantsResult>(
        `/backend/conversations/${conversationId}/participants`,
        { participantPhones },
      );
      return data;
    },
  });
}

/** Zera o contador de não lidas ao abrir a conversa. */
export function useMarkConversationReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { data } = await httpClient.post<ConversationResponse>(
        `/backend/conversations/${conversationId}/read`,
      );
      return data.conversation;
    },
    onSuccess: (conversation) => {
      upsertConversationInLists(queryClient, conversation);
      void queryClient.invalidateQueries({
        queryKey: conversationsUnreadCountQueryKey,
      });
    },
  });
}

export function useClearConversationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      await httpClient.delete(`/backend/conversations/${conversationId}`);
      return conversationId;
    },
    onSuccess: (conversationId) => {
      queryClient.setQueriesData<ConversationDto[]>(
        { queryKey: conversationsListPrefix },
        (current) =>
          current ? current.filter((item) => item.id !== conversationId) : current,
      );
      void queryClient.invalidateQueries({
        queryKey: conversationsUnreadCountQueryKey,
      });
      void queryClient.invalidateQueries({ queryKey: conversationsListPrefix });
    },
  });
}

export type GroupParticipantDto = {
  jid: string;
  phone: string | null;
  name: string | null;
  isAdmin: boolean;
  avatarUrl: string | null;
  customerId: string | null;
  customerName: string | null;
  customerContactId: string | null;
  isSelf: boolean;
  selfDisplayName: string | null;
};

export function useGroupParticipantsQuery(
  conversationId: string | null,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ["conversations", conversationId, "participants"] as const,
    enabled: Boolean(conversationId) && (options?.enabled ?? true),
    queryFn: async () => {
      const { data } = await httpClient.get<{
        participants: GroupParticipantDto[];
      }>(`/backend/conversations/${conversationId}/participants`);
      return data.participants;
    },
  });
}

export function useUpdateConversationStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      status,
    }: {
      conversationId: string;
      status: ConversationStatus;
    }) => {
      const { data } = await httpClient.patch<ConversationResponse>(
        `/backend/conversations/${conversationId}/status`,
        { status },
      );
      return data.conversation;
    },
    onSuccess: (conversation) => {
      upsertConversationInLists(queryClient, conversation);
    },
  });
}

/** Rebusca a foto de perfil do contato no WhatsApp (ícone no painel de detalhes). */
export function useRefreshConversationAvatarMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { data } = await httpClient.post<ConversationResponse>(
        `/backend/conversations/${conversationId}/avatar/refresh`,
      );
      return data.conversation;
    },
    onSuccess: (conversation) => {
      upsertConversationInLists(queryClient, conversation);
    },
  });
}

/** Cria um cliente com nome/foto/telefone do contato e vincula à conversa. */
export function useCreateCustomerFromConversationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { data } = await httpClient.post<{
        conversation: ConversationDto;
        customerId: string;
      }>(`/backend/conversations/${conversationId}/customer`);
      return data;
    },
    onSuccess: ({ conversation }) => {
      upsertConversationInLists(queryClient, conversation);
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

/** Atribuir/desatribuir responsável (permissão conversations.assign). */
export function useUpdateConversationAssigneeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      assigneeMembershipId,
    }: {
      conversationId: string;
      assigneeMembershipId: string | null;
    }) => {
      const { data } = await httpClient.patch<ConversationResponse>(
        `/backend/conversations/${conversationId}/assignee`,
        { assigneeMembershipId },
      );
      return data.conversation;
    },
    onSuccess: (conversation) => {
      upsertConversationInLists(queryClient, conversation);
    },
  });
}
