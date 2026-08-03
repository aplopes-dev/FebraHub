"use client";

import { useQuery, type QueryClient } from "@tanstack/react-query";
import { httpClient } from "@/lib/api/http-client";
import type {
  ConversationDto,
  ConversationsListResponse,
  ConversationsQueryParams,
} from "@/types/api/conversation";

/** Prefixo comum de todas as queries de lista de conversas. */
export const conversationsListPrefix = ["conversations", "list"] as const;

export const conversationsListKey = (params: ConversationsQueryParams) =>
  [...conversationsListPrefix, params] as const;

function normalizeParams(
  params: ConversationsQueryParams,
): ConversationsQueryParams {
  return {
    search: params.search?.trim() || undefined,
    status: params.status,
    scope: params.scope === "all" ? undefined : params.scope,
    filter: params.filter === "all" ? undefined : params.filter,
  };
}

export function useConversationsQuery(
  params: ConversationsQueryParams,
  options?: { refetchInterval?: number | false; enabled?: boolean },
) {
  const normalized = normalizeParams(params);

  return useQuery({
    queryKey: conversationsListKey(normalized),
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval ?? false,
    queryFn: async () => {
      const { data } = await httpClient.get<ConversationsListResponse>(
        "/backend/conversations",
        { params: normalized },
      );
      return data.conversations;
    },
  });
}

function sortByLastMessage(list: ConversationDto[]): ConversationDto[] {
  return [...list].sort((a, b) => {
    const timeA = new Date(a.lastMessageAt ?? a.updatedAt).getTime();
    const timeB = new Date(b.lastMessageAt ?? b.updatedAt).getTime();
    return timeB - timeA;
  });
}

/**
 * Substitui (ou insere via invalidate) uma conversa em todas as listas em
 * cache. Usado pelas mutações e pelos eventos SSE. Se a conversa não existe
 * em nenhuma lista carregada, invalida as listas — o filtro de cada lista é
 * responsabilidade do backend, então não dá para saber onde ela entra.
 */
export function upsertConversationInLists(
  queryClient: QueryClient,
  conversation: ConversationDto,
) {
  let found = false;

  queryClient.setQueriesData<ConversationDto[]>(
    { queryKey: conversationsListPrefix },
    (current) => {
      if (!current) return current;
      const index = current.findIndex((item) => item.id === conversation.id);
      if (index === -1) return current;
      found = true;
      const next = current.slice();
      next[index] = conversation;
      return sortByLastMessage(next);
    },
  );

  if (!found) {
    void queryClient.invalidateQueries({ queryKey: conversationsListPrefix });
  }
}

/**
 * Atualização parcial de uma conversa nas listas (ex.: preview da última
 * mensagem ao receber `message.new` antes do `conversation.updated`).
 */
export function patchConversationInLists(
  queryClient: QueryClient,
  conversationId: string,
  patch: Partial<ConversationDto>,
) {
  queryClient.setQueriesData<ConversationDto[]>(
    { queryKey: conversationsListPrefix },
    (current) => {
      if (!current) return current;
      const index = current.findIndex((item) => item.id === conversationId);
      if (index === -1) return current;
      const next = current.slice();
      next[index] = { ...next[index], ...patch };
      return sortByLastMessage(next);
    },
  );
}
