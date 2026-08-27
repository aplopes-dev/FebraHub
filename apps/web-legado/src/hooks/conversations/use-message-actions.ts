"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/auth-context";
import { httpClient } from "@/lib/api/http-client";
import {
  getMessageFromCache,
  upsertMessageInCache,
} from "@/hooks/conversations/use-conversation-messages";
import { conversationsListPrefix } from "@/hooks/conversations/use-conversations";
import type {
  ChatMessageDto,
  ForwardMessagesInput,
  ForwardMessagesResult,
  MessageDownloadResult,
} from "@/types/api/conversation";

type MessageResponse = { message: ChatMessageDto };

/**
 * Reagir a uma mensagem. `emoji: null` remove a minha reação; enviar outro
 * emoji troca a reação atual (semântica do backend).
 */
export function useReactToMessageMutation(conversationId: string) {
  const queryClient = useQueryClient();
  const { user, membership } = useAuth();

  return useMutation({
    mutationFn: async ({
      messageId,
      emoji,
    }: {
      messageId: string;
      emoji: string | null;
    }) => {
      const { data } = await httpClient.post<MessageResponse>(
        `/backend/conversations/messages/${messageId}/reactions`,
        { emoji },
      );
      return data.message;
    },
    onMutate: ({ messageId, emoji }) => {
      const previous = getMessageFromCache(
        queryClient,
        conversationId,
        messageId,
      );
      if (!previous || !membership) return { previous };

      const others = previous.reactions.filter(
        (reaction) => reaction.actorMembershipId !== membership.id,
      );
      const next: ChatMessageDto = {
        ...previous,
        reactions:
          emoji === null
            ? others
            : [
                ...others,
                {
                  emoji,
                  actorKey: `agent:${membership.id}`,
                  actorMembershipId: membership.id,
                  actorName: user?.name ?? null,
                },
              ],
      };
      upsertMessageInCache(queryClient, conversationId, next);
      return { previous };
    },
    onSuccess: (message) => {
      upsertMessageInCache(queryClient, conversationId, message);
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        upsertMessageInCache(queryClient, conversationId, context.previous);
      }
    },
  });
}

/** Editar texto de uma mensagem minha (outbound, tipo texto). */
export function useEditMessageMutation(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageId,
      contentText,
    }: {
      messageId: string;
      contentText: string;
    }) => {
      const { data } = await httpClient.patch<MessageResponse>(
        `/backend/conversations/messages/${messageId}`,
        { contentText },
      );
      return data.message;
    },
    onMutate: ({ messageId, contentText }) => {
      const previous = getMessageFromCache(
        queryClient,
        conversationId,
        messageId,
      );
      if (previous) {
        upsertMessageInCache(queryClient, conversationId, {
          ...previous,
          contentText,
          editedAt: new Date().toISOString(),
        });
      }
      return { previous };
    },
    onSuccess: (message) => {
      upsertMessageInCache(queryClient, conversationId, message);
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        upsertMessageInCache(queryClient, conversationId, context.previous);
      }
    },
  });
}

/** Apagar para todos. */
export function useDeleteMessageMutation(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId }: { messageId: string }) => {
      const { data } = await httpClient.delete<MessageResponse>(
        `/backend/conversations/messages/${messageId}`,
      );
      return data.message;
    },
    onMutate: ({ messageId }) => {
      const previous = getMessageFromCache(
        queryClient,
        conversationId,
        messageId,
      );
      if (previous) {
        upsertMessageInCache(queryClient, conversationId, {
          ...previous,
          deletedAt: new Date().toISOString(),
        });
      }
      return { previous };
    },
    onSuccess: (message) => {
      upsertMessageInCache(queryClient, conversationId, message);
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        upsertMessageInCache(queryClient, conversationId, context.previous);
      }
    },
  });
}

/** Encaminhar mensagens para outras conversas (máx. 30 × 30). */
export function useForwardMessagesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ForwardMessagesInput) => {
      const { data } = await httpClient.post<ForwardMessagesResult>(
        "/backend/conversations/forward",
        input,
      );
      return data;
    },
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({
        queryKey: conversationsListPrefix,
      });
      for (const targetId of variables.targetConversationIds) {
        void queryClient.invalidateQueries({
          queryKey: ["conversations", "messages", targetId],
        });
      }
    },
  });
}

export const messageMediaKey = (
  messageId: string,
  disposition: "inline" | "attachment",
) => ["conversations", "media", messageId, disposition] as const;

/**
 * URL assinada (expira!) para exibir a mídia de uma mensagem.
 * `staleTime` deriva do `expiresIn` para renovar antes de expirar.
 */
export function useMessageMediaUrl(
  messageId: string | null,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: messageMediaKey(messageId ?? "", "inline"),
    enabled: Boolean(messageId) && (options?.enabled ?? true),
    queryFn: async () => {
      const { data } = await httpClient.get<MessageDownloadResult>(
        `/backend/conversations/messages/${messageId}/download`,
        { params: { disposition: "inline" } },
      );
      return data;
    },
    staleTime: (query) => {
      const expiresIn = query.state.data?.expiresIn;
      return expiresIn ? Math.max(10_000, (expiresIn - 60) * 1000) : 0;
    },
    retry: 1,
  });
}

/** Busca a URL de download (attachment) na hora do clique. */
export async function fetchMessageDownloadUrl(
  messageId: string,
  disposition: "inline" | "attachment" = "attachment",
): Promise<MessageDownloadResult> {
  const { data } = await httpClient.get<MessageDownloadResult>(
    `/backend/conversations/messages/${messageId}/download`,
    { params: { disposition } },
  );
  return data;
}

/** Dispara o download do anexo de uma mensagem no browser. */
export async function downloadMessageAttachment(messageId: string) {
  const { downloadUrl, fileName } = await fetchMessageDownloadUrl(
    messageId,
    "attachment",
  );
  const anchor = document.createElement("a");
  anchor.href = downloadUrl;
  anchor.rel = "noopener noreferrer";
  if (fileName) anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
