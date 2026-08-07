"use client";

import { useQuery } from "@tanstack/react-query";
import { httpClient } from "@/lib/api/http-client";

export const conversationsUnreadCountQueryKey = [
  "conversations",
  "unread-count",
] as const;

export function useConversationsUnreadCountQuery(options?: {
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: conversationsUnreadCountQueryKey,
    enabled: options?.enabled ?? true,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data } = await httpClient.get<{ count: number }>(
        "/backend/conversations/unread-count",
      );
      return data.count;
    },
  });
}
