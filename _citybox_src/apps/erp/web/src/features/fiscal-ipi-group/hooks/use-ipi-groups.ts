"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import {
  createIpiGroupApi,
  getIpiGroupApi,
  listIpiGroupProductsApi,
  listIpiGroupsApi,
  updateIpiGroupApi,
} from "../api/ipi-group.service";
import type { UpsertIpiGroupPayload } from "../api/ipi-group.dto";

const KEY = "fiscal-ipi-groups";

export function ipiGroupKeys(scope: string) {
  return {
    all: ["comercio", KEY, scope] as const,
    list: ["comercio", KEY, scope, "list"] as const,
    detail: (id: string) => ["comercio", KEY, scope, "detail", id] as const,
    products: (id: string) => ["comercio", KEY, scope, "products", id] as const,
  };
}

export function useIpiGroupsQuery() {
  const { scope, ready } = useCatalogScope();
  return useQuery({
    queryKey: ipiGroupKeys(scope).list,
    queryFn: listIpiGroupsApi,
    enabled: ready,
  });
}

export function useIpiGroupQuery(id: string | null) {
  const { scope, ready } = useCatalogScope();
  return useQuery({
    queryKey: ipiGroupKeys(scope).detail(id ?? ""),
    queryFn: () => getIpiGroupApi(id as string),
    enabled: ready && Boolean(id),
  });
}

export function useIpiGroupProductsQuery(id: string | null) {
  const { scope, ready } = useCatalogScope();
  return useQuery({
    queryKey: ipiGroupKeys(scope).products(id ?? ""),
    queryFn: () => listIpiGroupProductsApi(id as string),
    enabled: ready && Boolean(id),
  });
}

export function useCreateIpiGroupMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertIpiGroupPayload) => createIpiGroupApi(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ipiGroupKeys(scope).all }),
  });
}

export function useUpdateIpiGroupMutation(id: string) {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertIpiGroupPayload) => updateIpiGroupApi(id, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ipiGroupKeys(scope).all }),
  });
}
