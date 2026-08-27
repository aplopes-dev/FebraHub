"use client";

import {
  useInfiniteQuery,
  type InfiniteData,
  type QueryClient,
} from "@tanstack/react-query";
import { httpClient } from "@/lib/api/http-client";
import type {
  ChatMessageDto,
  ConversationMessagesPage,
} from "@/types/api/conversation";

export const conversationMessagesPrefix = [
  "conversations",
  "messages",
] as const;

export const conversationMessagesKey = (conversationId: string) =>
  [...conversationMessagesPrefix, conversationId] as const;

export type ConversationMessagesData = InfiniteData<
  ConversationMessagesPage,
  string | null
>;

/**
 * Mensagens da conversa com paginação para trás por cursor:
 * - página 0 (sem cursor) = bloco mais recente;
 * - `fetchNextPage` busca blocos mais antigos (cursor = id da mensagem mais
 *   antiga já carregada, fornecido pelo backend em `nextCursor`).
 */
export function useConversationMessagesQuery(
  conversationId: string | null,
  options?: { refetchInterval?: number | false },
) {
  return useInfiniteQuery({
    queryKey: conversationMessagesKey(conversationId ?? ""),
    enabled: Boolean(conversationId),
    initialPageParam: null as string | null,
    refetchInterval: options?.refetchInterval ?? false,
    queryFn: async ({ pageParam }) => {
      const { data } = await httpClient.get<ConversationMessagesPage>(
        `/backend/conversations/${conversationId}/messages`,
        { params: { cursor: pageParam ?? undefined, limit: 50 } },
      );
      return data;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

/**
 * Achata as páginas em uma lista única ascendente (mais antiga → mais nova),
 * com dedupe por id (SSE + refetch podem se sobrepor nas bordas).
 */
export function flattenConversationMessages(
  data: InfiniteData<ConversationMessagesPage, unknown> | undefined,
): ChatMessageDto[] {
  if (!data) return [];
  const seen = new Set<string>();
  const result: ChatMessageDto[] = [];
  for (let i = data.pages.length - 1; i >= 0; i -= 1) {
    for (const message of data.pages[i].messages) {
      if (seen.has(message.id)) continue;
      seen.add(message.id);
      result.push(message);
    }
  }
  return result;
}

export function getMessageFromCache(
  queryClient: QueryClient,
  conversationId: string,
  messageId: string,
): ChatMessageDto | undefined {
  const data = queryClient.getQueryData<ConversationMessagesData>(
    conversationMessagesKey(conversationId),
  );
  if (!data) return undefined;
  for (const page of data.pages) {
    const match = page.messages.find((message) => message.id === messageId);
    if (match) return match;
  }
  return undefined;
}

/**
 * Insere/substitui uma mensagem no cache da conversa.
 * - `replaceId` permite trocar uma mensagem otimista (id temp) pela real;
 * - se a mensagem não existe, é anexada ao final da página mais recente;
 * - dedupe por id garante que SSE + resposta do POST não dupliquem.
 */
export function upsertMessageInCache(
  queryClient: QueryClient,
  conversationId: string,
  message: ChatMessageDto,
  options?: { replaceId?: string },
) {
  queryClient.setQueryData<ConversationMessagesData>(
    conversationMessagesKey(conversationId),
    (current) => {
      if (!current || current.pages.length === 0) return current;
      const replaceId = options?.replaceId;
      let replaced = false;

      const pages = current.pages.map((page) => {
        const index = page.messages.findIndex(
          (item) => item.id === message.id || (replaceId != null && item.id === replaceId),
        );
        if (index === -1) return page;
        replaced = true;
        const messages = page.messages.slice();
        messages[index] = message;
        return { ...page, messages };
      });

      if (replaced) return { ...current, pages };

      const [first, ...rest] = pages;
      return {
        ...current,
        pages: [{ ...first, messages: [...first.messages, message] }, ...rest],
      };
    },
  );
}

/** Atualização parcial de uma mensagem já em cache (ex.: marcar como failed). */
export function patchMessageInCache(
  queryClient: QueryClient,
  conversationId: string,
  messageId: string,
  patch: Partial<ChatMessageDto>,
) {
  queryClient.setQueryData<ConversationMessagesData>(
    conversationMessagesKey(conversationId),
    (current) => {
      if (!current) return current;
      let changed = false;
      const pages = current.pages.map((page) => {
        const index = page.messages.findIndex((item) => item.id === messageId);
        if (index === -1) return page;
        changed = true;
        const messages = page.messages.slice();
        messages[index] = { ...messages[index], ...patch };
        return { ...page, messages };
      });
      return changed ? { ...current, pages } : current;
    },
  );
}

/** Remove uma mensagem do cache (ex.: descartar bolha otimista com falha). */
export function removeMessageFromCache(
  queryClient: QueryClient,
  conversationId: string,
  messageId: string,
) {
  queryClient.setQueryData<ConversationMessagesData>(
    conversationMessagesKey(conversationId),
    (current) => {
      if (!current) return current;
      let changed = false;
      const pages = current.pages.map((page) => {
        if (!page.messages.some((item) => item.id === messageId)) return page;
        changed = true;
        return {
          ...page,
          messages: page.messages.filter((item) => item.id !== messageId),
        };
      });
      return changed ? { ...current, pages } : current;
    },
  );
}
