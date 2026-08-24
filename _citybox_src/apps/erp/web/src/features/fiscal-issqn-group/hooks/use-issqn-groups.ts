"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import {
  createIssqnGroupApi,
  getIssqnGroupApi,
  listIssqnGroupProductsApi,
  listIssqnGroupsApi,
  updateIssqnGroupApi,
} from "../api/issqn-group.service";
import type { UpsertIssqnGroupPayload } from "../api/issqn-group.dto";

const KEY = "fiscal-issqn-groups";

export function issqnGroupKeys(scope: string) {
  return {
    all: ["comercio", KEY, scope] as const,
    list: ["comercio", KEY, scope, "list"] as const,
    detail: (id: string) => ["comercio", KEY, scope, "detail", id] as const,
    products: (id: string) =>
      ["comercio", KEY, scope, "products", id] as const,
  };
}

export function useIssqnGroupsQuery() {
  const { scope, ready } = useCatalogScope();
  return useQuery({
    queryKey: issqnGroupKeys(scope).list,
    queryFn: listIssqnGroupsApi,
    enabled: ready,
  });
}

export function useIssqnGroupQuery(id: string | null) {
  const { scope, ready } = useCatalogScope();
  return useQuery({
    queryKey: issqnGroupKeys(scope).detail(id ?? ""),
    queryFn: () => getIssqnGroupApi(id as string),
    enabled: ready && Boolean(id),
  });
}

export function useIssqnGroupProductsQuery(id: string | null) {
  const { scope, ready } = useCatalogScope();
  return useQuery({
    queryKey: issqnGroupKeys(scope).products(id ?? ""),
    queryFn: () => listIssqnGroupProductsApi(id as string),
    enabled: ready && Boolean(id),
  });
}

export function useCreateIssqnGroupMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertIssqnGroupPayload) =>
      createIssqnGroupApi(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: issqnGroupKeys(scope).all }),
  });
}

export function useUpdateIssqnGroupMutation(id: string) {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertIssqnGroupPayload) =>
      updateIssqnGroupApi(id, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: issqnGroupKeys(scope).all }),
  });
}
