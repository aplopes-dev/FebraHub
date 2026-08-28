"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getEditionDetail,
  getRoom,
  listEditions,
} from "@/features/event-editions/services/editions.service";
import type { RoomFilter } from "@/features/event-editions/types/edition-view";
import { useCatalogScope } from "@/lib/organization-context";

export function useEditionsQuery() {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: ["commercial", scope, "editions"],
    queryFn: async () => listEditions(),
    enabled: ready,
  });
}

export function useEditionDetailQuery(editionId: string | undefined) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: ["commercial", scope, "edition", editionId ?? ""],
    queryFn: async () => getEditionDetail(editionId!) ?? null,
    enabled: ready && Boolean(editionId),
  });
}

export function useRoomQuery(
  editionId: string | undefined,
  filter: RoomFilter,
  search: string,
) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: ["commercial", scope, "room", editionId ?? "", filter, search],
    queryFn: async () => getRoom(editionId!, filter, search),
    enabled: ready && Boolean(editionId),
  });
}
